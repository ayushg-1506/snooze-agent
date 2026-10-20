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

    const issue = await issuesCol.findOne({ _id: issueId });

    // Try string matching if ObjectId lookup fails
    let issueFinal = issue;
    if (!issueFinal) {
      const { ObjectId } = await import('mongodb');
      try {
        issueFinal = await issuesCol.findOne({ _id: new ObjectId(issueId) });
      } catch {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }
    }

    if (!issueFinal) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const [owner, repo] = issueFinal.repoFullName.split('/');

    if (action === 'label') {
      // Apply labels to GitHub
      const labels = [];
      const cat = issueFinal.triage?.category;
      const pri = issueFinal.triage?.priority;

      if (cat && LABEL_COLORS[cat]) labels.push(LABEL_COLORS[cat]);
      if (pri && LABEL_COLORS[pri]) labels.push(LABEL_COLORS[pri]);

      if (labels.length === 0) {
        return NextResponse.json({ error: 'No labels to apply' }, { status: 400 });
      }

      await addLabelsToIssue(owner, repo, issueFinal.number, labels);

      // Update status in DB
      await issuesCol.updateOne(
        { _id: issueFinal._id },
        { $set: { 'triage.labelsApplied': true } }
      );

      await activitiesCol.insertOne({
        type: 'labeled',
        repoFullName: issueFinal.repoFullName,
        issueNumber: issueFinal.number,
        issueTitle: issueFinal.title,
        message: `Applied labels to #${issueFinal.number}: ${labels.map((l) => l.name).join(', ')}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ message: 'Labels applied successfully' });
    }

    if (action === 'respond') {
      const draftResponse = issueFinal.triage?.draftResponse;
      if (!draftResponse) {
        return NextResponse.json({ error: 'No draft response available' }, { status: 400 });
      }

      await postComment(owner, repo, issueFinal.number, draftResponse);

      await issuesCol.updateOne(
        { _id: issueFinal._id },
        { $set: { 'triage.responsePosted': true } }
      );

      await activitiesCol.insertOne({
        type: 'responded',
        repoFullName: issueFinal.repoFullName,
        issueNumber: issueFinal.number,
        issueTitle: issueFinal.title,
        message: `Posted AI response to #${issueFinal.number}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ message: 'Response posted successfully' });
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
