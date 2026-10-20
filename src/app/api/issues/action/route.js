import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { addLabelsToIssue, postComment, LABEL_COLORS } from '@/lib/github';

// POST /api/issues/action — Apply labels or post response
export async function POST(request) {
  try {
    const body = await request.json();
    const { issueId, action } = body;

    if (!issueId || !action) {
      return NextResponse.json(
        { error: 'issueId and action are required' },
        { status: 400 }
      );
    }

    const issuesCol = await getCollection('issues');
    const activitiesCol = await getCollection('activities');

    let issueFinal = await issuesCol.findOne({ _id: issueId });
    if (!issueFinal) {
      const { ObjectId } = await import('mongodb');
      try {
        issueFinal = await issuesCol.findOne({ _id: new ObjectId(issueId) });
      } catch (e) {}
    }

    if (!issueFinal) {
      return NextResponse.json({ error: 'Issue not found in database' }, { status: 404 });
    }

    const [owner, repo] = issueFinal.repoFullName.split('/');

    if (action === 'label') {
      const labels = [];
      const cat = issueFinal.triage?.category;
      const pri = issueFinal.triage?.priority;

      if (cat && LABEL_COLORS[cat]) labels.push(LABEL_COLORS[cat]);
      if (pri && LABEL_COLORS[pri]) labels.push(LABEL_COLORS[pri]);

      let githubUpdated = false;
      try {
        await addLabelsToIssue(owner, repo, issueFinal.number, labels);
        githubUpdated = true;
      } catch (err) {
        console.warn(`Could not sync label to GitHub (issue #${issueFinal.number}):`, err.message);
      }

      await issuesCol.updateOne(
        { _id: issueFinal._id },
        { $set: { 'triage.labelsApplied': true } }
      );

      await activitiesCol.insertOne({
        type: 'labeled',
        repoFullName: issueFinal.repoFullName,
        issueNumber: issueFinal.number,
        issueTitle: issueFinal.title,
        message: `Applied labels to #${issueFinal.number}: ${labels.map((l) => l.name).join(', ')}${githubUpdated ? ' (GitHub synced)' : ' (Docket updated)'}`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        message: githubUpdated ? 'Labels applied to GitHub successfully' : 'Labels recorded in triage docket',
      });
    }

    if (action === 'respond') {
      const draftResponse = issueFinal.triage?.draftResponse;
      if (!draftResponse) {
        return NextResponse.json({ error: 'No draft response available' }, { status: 400 });
      }

      let githubUpdated = false;
      try {
        await postComment(owner, repo, issueFinal.number, draftResponse);
        githubUpdated = true;
      } catch (err) {
        console.warn(`Could not publish comment to GitHub (issue #${issueFinal.number}):`, err.message);
      }

      await issuesCol.updateOne(
        { _id: issueFinal._id },
        { $set: { 'triage.responsePosted': true } }
      );

      await activitiesCol.insertOne({
        type: 'responded',
        repoFullName: issueFinal.repoFullName,
        issueNumber: issueFinal.number,
        issueTitle: issueFinal.title,
        message: `Approved & published maintainer response for #${issueFinal.number}${githubUpdated ? ' (GitHub synced)' : ' (Docket updated)'}`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        message: githubUpdated ? 'Response posted to GitHub successfully' : 'Response marked approved in triage docket',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error performing issue action:', error);
    return NextResponse.json(
      { error: 'Action failed', details: error.message },
      { status: 500 }
    );
  }
}
