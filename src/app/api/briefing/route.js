import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { generateBriefing } from '@/lib/ai';

// GET /api/briefing — Generate overnight briefing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    const issuesCol = await getCollection('issues');
    const activitiesCol = await getCollection('activities');

    // Get issues triaged in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const query = { 'triage.triagedAt': { $gte: oneDayAgo } };
    if (repo) query.repoFullName = repo;

    const recentIssues = await issuesCol
      .find(query)
      .sort({ 'triage.triagedAt': -1 })
      .limit(50)
      .toArray();

    // Get recent activities
    const activityQuery = { createdAt: { $gte: oneDayAgo } };
    if (repo) activityQuery.repoFullName = repo;

    const recentActivities = await activitiesCol
      .find(activityQuery)
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    // Build stats summary
    const stats = {
      totalTriaged: recentIssues.length,
      categories: {},
      priorities: {},
      sentiments: {},
    };

    recentIssues.forEach((issue) => {
      const cat = issue.triage?.category;
      const pri = issue.triage?.priority;
      const sent = issue.triage?.sentiment;
      if (cat) stats.categories[cat] = (stats.categories[cat] || 0) + 1;
      if (pri) stats.priorities[pri] = (stats.priorities[pri] || 0) + 1;
      if (sent) stats.sentiments[sent] = (stats.sentiments[sent] || 0) + 1;
    });

    // Generate AI briefing
    let briefingText = '';
    if (recentIssues.length > 0) {
      const summaryLines = recentIssues.map(
        (issue) =>
          `- #${issue.number} "${issue.title}" → ${issue.triage?.category} / ${issue.triage?.priority} priority (${issue.triage?.sentiment} sentiment)`
      );

      const summaryText = `${recentIssues.length} issues triaged in the last 24 hours:\n${summaryLines.join('\n')}\n\nCategory breakdown: ${JSON.stringify(stats.categories)}\nPriority breakdown: ${JSON.stringify(stats.priorities)}\nSentiment: ${JSON.stringify(stats.sentiments)}`;

      briefingText = await generateBriefing(summaryText);
    } else {
      briefingText = 'Nothing happened overnight — your repos are quiet. Time for another nap! 🦥💤';
    }

    // Format activities for the feed
    const activities = recentActivities.map((a) => ({
      ...a,
      _id: a._id.toString(),
    }));

    // Critical issues needing attention
    const criticalIssues = recentIssues
      .filter((i) => i.triage?.priority === 'critical' || i.triage?.priority === 'high')
      .map((i) => ({
        _id: i._id.toString(),
        number: i.number,
        title: i.title,
        repoFullName: i.repoFullName,
        priority: i.triage?.priority,
        category: i.triage?.category,
        sentiment: i.triage?.sentiment,
        url: i.url,
      }));

    return NextResponse.json({
      briefing: briefingText,
      stats,
      activities,
      criticalIssues,
      period: {
        from: oneDayAgo.toISOString(),
        to: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing', details: error.message },
      { status: 500 }
    );
  }
}
