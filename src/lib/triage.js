import { getCollection } from './mongodb';
import { fetchRepoIssues, LABEL_COLORS } from './github';
import { triageIssue, generateResponse, findDuplicates } from './ai';

/**
 * Full triage pipeline for a repository:
 * 1. Fetch issues from GitHub
 * 2. Classify each with AI
 * 3. Detect duplicates
 * 4. Generate responses
 * 5. Store results
 * 6. Log activities
 */
export async function triageRepository(repoFullName) {
  const [owner, repo] = repoFullName.split('/');
  const issuesCol = await getCollection('issues');
  const activitiesCol = await getCollection('activities');
  const reposCol = await getCollection('repos');

  // Get last sync time
  const repoDoc = await reposCol.findOne({ fullName: repoFullName });
  const since = repoDoc?.lastSynced?.toISOString() || null;

  // 1. Fetch issues from GitHub
  const ghIssues = await fetchRepoIssues(owner, repo, since);

  if (ghIssues.length === 0) {
    return { triaged: 0, message: 'No new issues found' };
  }

  // Get existing issues for duplicate detection
  const existingIssues = await issuesCol
    .find({ repoFullName, state: 'open' })
    .project({ number: 1, title: 1, body: 1 })
    .toArray();

  const results = {
    triaged: 0,
    categories: { bug: 0, feature: 0, question: 0, docs: 0, duplicate: 0, enhancement: 0 },
    priorities: { critical: 0, high: 0, medium: 0, low: 0 },
    errors: 0,
  };

  // 2-5. Process each issue
  for (const ghIssue of ghIssues) {
    try {
      // Check if already triaged
      const existing = await issuesCol.findOne({ githubId: ghIssue.id });
      if (existing?.triage?.triagedAt) {
        // Update issue metadata but skip re-triage
        await issuesCol.updateOne(
          { githubId: ghIssue.id },
          {
            $set: {
              title: ghIssue.title,
              body: ghIssue.body,
              state: ghIssue.state,
              labels: ghIssue.labels.map((l) => l.name),
              updatedAt: new Date(ghIssue.updated_at),
              commentsCount: ghIssue.comments,
            },
          }
        );
        continue;
      }

      // AI Classification
      const triageResult = await triageIssue(ghIssue);

      // Duplicate detection
      const duplicates = await findDuplicates(
        ghIssue.title,
        ghIssue.body,
        existingIssues.filter((ei) => ei.number !== ghIssue.number)
      );

      // Generate draft response
      const draftResponse = await generateResponse(ghIssue, triageResult);

      // Build label suggestions
      const suggestedLabels = [];
      if (triageResult.category && LABEL_COLORS[triageResult.category]) {
        suggestedLabels.push(LABEL_COLORS[triageResult.category]);
      }
      if (triageResult.priority && LABEL_COLORS[triageResult.priority]) {
        suggestedLabels.push(LABEL_COLORS[triageResult.priority]);
      }

      // Store in MongoDB
      const issueDoc = {
        githubId: ghIssue.id,
        repoFullName,
        number: ghIssue.number,
        title: ghIssue.title,
        body: ghIssue.body || '',
        url: ghIssue.html_url,
        author: ghIssue.user?.login || 'unknown',
        authorAvatar: ghIssue.user?.avatar_url || '',
        state: ghIssue.state,
        labels: ghIssue.labels.map((l) => l.name),
        commentsCount: ghIssue.comments,
        createdAt: new Date(ghIssue.created_at),
        updatedAt: new Date(ghIssue.updated_at),
        triage: {
          ...triageResult,
          draftResponse,
          duplicates,
          suggestedLabels: suggestedLabels.map((l) => l.name),
          labelsApplied: false,
          responsePosted: false,
          triagedAt: new Date(),
        },
      };

      await issuesCol.updateOne(
        { githubId: ghIssue.id },
        { $set: issueDoc },
        { upsert: true }
      );

      // Log activity
      await activitiesCol.insertOne({
        type: 'triaged',
        repoFullName,
        issueNumber: ghIssue.number,
        issueTitle: ghIssue.title,
        message: `Triaged #${ghIssue.number} as ${triageResult.category} (${triageResult.priority} priority)`,
        metadata: {
          category: triageResult.category,
          priority: triageResult.priority,
          sentiment: triageResult.sentiment,
        },
        createdAt: new Date(),
      });

      results.triaged++;
      results.categories[triageResult.category] = (results.categories[triageResult.category] || 0) + 1;
      results.priorities[triageResult.priority] = (results.priorities[triageResult.priority] || 0) + 1;

      // Rate limiting — small delay between issues
      await delay(300);
    } catch (error) {
      console.error(`Error triaging issue #${ghIssue.number}:`, error.message);
      results.errors++;
    }
  }

  // Update repo last synced timestamp
  await reposCol.updateOne(
    { fullName: repoFullName },
    { $set: { lastSynced: new Date() } }
  );

  // Log sync activity
  await activitiesCol.insertOne({
    type: 'sync_complete',
    repoFullName,
    message: `Synced ${repoFullName}: ${results.triaged} issues triaged, ${results.errors} errors`,
    metadata: results,
    createdAt: new Date(),
  });

  return results;
}

/**
 * Calculate repository health score
 */
export async function calculateRepoHealth(repoFullName) {
  const issuesCol = await getCollection('issues');

  const openIssues = await issuesCol.countDocuments({
    repoFullName,
    state: 'open',
  });

  const criticalCount = await issuesCol.countDocuments({
    repoFullName,
    state: 'open',
    'triage.priority': 'critical',
  });

  const highCount = await issuesCol.countDocuments({
    repoFullName,
    state: 'open',
    'triage.priority': 'high',
  });

  // Stale issues (no update in 14 days)
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 14);

  const staleCount = await issuesCol.countDocuments({
    repoFullName,
    state: 'open',
    updatedAt: { $lt: staleDate },
  });

  // Calculate score (100 = perfect, 0 = terrible)
  let score = 100;
  score -= criticalCount * 15; // Critical issues hurt a lot
  score -= highCount * 8;
  score -= Math.min(staleCount * 5, 25); // Stale issues cap at -25
  score -= Math.min(openIssues * 0.5, 20); // Many open issues cap at -20

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade, label;
  if (score >= 90) { grade = 'A'; label = 'Excellent'; }
  else if (score >= 75) { grade = 'B'; label = 'Good'; }
  else if (score >= 60) { grade = 'C'; label = 'Fair'; }
  else if (score >= 40) { grade = 'D'; label = 'Needs Attention'; }
  else { grade = 'F'; label = 'Critical'; }

  return {
    score,
    grade,
    label,
    openIssues,
    criticalCount,
    highCount,
    staleCount,
  };
}

/**
 * Get issues that are stale (no update in N days)
 */
export async function getStaleIssues(repoFullName, daysThreshold = 14) {
  const issuesCol = await getCollection('issues');
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - daysThreshold);

  const query = {
    state: 'open',
    updatedAt: { $lt: staleDate },
  };

  if (repoFullName) {
    query.repoFullName = repoFullName;
  }

  return issuesCol
    .find(query)
    .sort({ updatedAt: 1 })
    .limit(50)
    .toArray();
}

/**
 * Get contributor insights for a repo
 */
export async function getContributorInsights(repoFullName) {
  const issuesCol = await getCollection('issues');

  const pipeline = [
    { $match: { repoFullName } },
    {
      $group: {
        _id: '$author',
        count: { $sum: 1 },
        avatar: { $first: '$authorAvatar' },
        categories: { $push: '$triage.category' },
        firstIssue: { $min: '$createdAt' },
        lastIssue: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ];

  const contributors = await issuesCol.aggregate(pipeline).toArray();

  return contributors.map((c) => {
    const categoryCounts = {};
    (c.categories || []).forEach((cat) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      username: c._id,
      avatar: c.avatar,
      issueCount: c.count,
      categoryCounts,
      firstIssue: c.firstIssue,
      lastIssue: c.lastIssue,
      isFirstTimer: c.count === 1,
    };
  });
}

/**
 * Get analytics data for charts
 */
export async function getAnalyticsData(repoFullName) {
  const issuesCol = await getCollection('issues');

  const matchStage = repoFullName ? { $match: { repoFullName } } : { $match: {} };

  // Category distribution
  const categoryPipeline = [
    matchStage,
    { $match: { 'triage.category': { $exists: true } } },
    { $group: { _id: '$triage.category', count: { $sum: 1 } } },
  ];

  // Priority distribution
  const priorityPipeline = [
    matchStage,
    { $match: { 'triage.priority': { $exists: true } } },
    { $group: { _id: '$triage.priority', count: { $sum: 1 } } },
  ];

  // Sentiment distribution
  const sentimentPipeline = [
    matchStage,
    { $match: { 'triage.sentiment': { $exists: true } } },
    { $group: { _id: '$triage.sentiment', count: { $sum: 1 } } },
  ];

  // Issues over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timelinePipeline = [
    matchStage,
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        bugs: {
          $sum: { $cond: [{ $eq: ['$triage.category', 'bug'] }, 1, 0] },
        },
        features: {
          $sum: { $cond: [{ $eq: ['$triage.category', 'feature'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const [categories, priorities, sentiments, timeline] = await Promise.all([
    issuesCol.aggregate(categoryPipeline).toArray(),
    issuesCol.aggregate(priorityPipeline).toArray(),
    issuesCol.aggregate(sentimentPipeline).toArray(),
    issuesCol.aggregate(timelinePipeline).toArray(),
  ]);

  // Total counts
  const total = await issuesCol.countDocuments(repoFullName ? { repoFullName } : {});
  const openCount = await issuesCol.countDocuments(
    repoFullName ? { repoFullName, state: 'open' } : { state: 'open' }
  );

  return {
    categories: categories.map((c) => ({ name: c._id, value: c.count })),
    priorities: priorities.map((p) => ({ name: p._id, value: p.count })),
    sentiments: sentiments.map((s) => ({ name: s._id, value: s.count })),
    timeline: timeline.map((t) => ({
      date: t._id,
      total: t.count,
      bugs: t.bugs,
      features: t.features,
    })),
    total,
    openCount,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
