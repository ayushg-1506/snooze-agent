import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { triageIssue, generateResponse, findDuplicates } from '@/lib/ai';
import { LABEL_COLORS, addLabelsToIssue, postComment } from '@/lib/github';

export async function POST(request) {
  try {
    const event = request.headers.get('x-github-event');
    const body = await request.json();

    if (event !== 'issues') {
      return NextResponse.json({ message: 'Ignored non-issues event' });
    }

    const { action, issue, repository } = body;
    if (action !== 'opened' && action !== 'reopened') {
      return NextResponse.json({ message: `Ignored action: ${action}` });
    }

    const repoFullName = repository.full_name;
    const issuesCol = await getCollection('issues');
    const activitiesCol = await getCollection('activities');
    const reposCol = await getCollection('repos');

    // Check if repo settings enable auto-label or auto-respond
    const repoDoc = await reposCol.findOne({ fullName: repoFullName });
    const settings = repoDoc?.settings || { autoLabel: false, autoRespond: false };

    // Triage
    const triageResult = await triageIssue(issue);
    const existingIssues = await issuesCol
      .find({ repoFullName, state: 'open' })
      .project({ number: 1, title: 1, body: 1 })
      .toArray();

    const duplicates = await findDuplicates(issue.title, issue.body, existingIssues);
    const draftResponse = await generateResponse(issue, triageResult);

    const suggestedLabels = [];
    if (triageResult.category && LABEL_COLORS[triageResult.category]) {
      suggestedLabels.push(LABEL_COLORS[triageResult.category]);
    }
    if (triageResult.priority && LABEL_COLORS[triageResult.priority]) {
      suggestedLabels.push(LABEL_COLORS[triageResult.priority]);
    }

    let labelsApplied = false;
    let responsePosted = false;

    const [owner, repoName] = repoFullName.split('/');

    if (settings.autoLabel && suggestedLabels.length > 0) {
      try {
        await addLabelsToIssue(owner, repoName, issue.number, suggestedLabels);
        labelsApplied = true;
      } catch (err) {
        console.error('Webhook auto-label failed:', err);
      }
    }

    if (settings.autoRespond && draftResponse) {
      try {
        await postComment(owner, repoName, issue.number, draftResponse);
        responsePosted = true;
      } catch (err) {
        console.error('Webhook auto-respond failed:', err);
      }
    }

    const issueDoc = {
      githubId: issue.id,
      repoFullName,
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      url: issue.html_url,
      author: issue.user?.login || 'unknown',
      authorAvatar: issue.user?.avatar_url || '',
      state: issue.state,
      labels: issue.labels?.map((l) => l.name) || [],
      commentsCount: issue.comments || 0,
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      triage: {
        ...triageResult,
        draftResponse,
        duplicates,
        suggestedLabels: suggestedLabels.map((l) => l.name),
        labelsApplied,
        responsePosted,
        triagedAt: new Date(),
      },
    };

    await issuesCol.updateOne(
      { githubId: issue.id },
      { $set: issueDoc },
      { upsert: true }
    );

    await activitiesCol.insertOne({
      type: 'webhook_triage',
      repoFullName,
      issueNumber: issue.number,
      issueTitle: issue.title,
      message: `⚡ Live Webhook triaged #${issue.number} as ${triageResult.category} (${triageResult.priority})`,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Webhook triaged successfully', issueNumber: issue.number });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
