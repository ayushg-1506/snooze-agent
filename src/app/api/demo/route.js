import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST() {
  try {
    const reposCol = await getCollection('repos');
    const issuesCol = await getCollection('issues');
    const activitiesCol = await getCollection('activities');

    // Create demo repo
    const demoRepo = {
      owner: 'ayushg-1506',
      name: 'snooze-agent',
      fullName: 'ayushg-1506/snooze-agent',
      githubId: 88992211,
      description: 'Autonomous AI issue triage bot for lazy maintainers — works while you sleep.',
      stars: 142,
      forks: 28,
      language: 'JavaScript',
      openIssuesCount: 6,
      avatarUrl: 'https://avatars.githubusercontent.com/u/88992211?v=4',
      settings: {
        autoLabel: true,
        autoRespond: false,
        syncInterval: '4h',
      },
      lastSynced: new Date(),
      createdAt: new Date(Date.now() - 7 * 86400000),
    };

    await reposCol.updateOne(
      { fullName: demoRepo.fullName },
      { $set: demoRepo },
      { upsert: true }
    );

    // Sample overnight issues
    const now = Date.now();
    const demoIssues = [
      {
        githubId: 1001,
        repoFullName: 'ayushg-1506/snooze-agent',
        number: 42,
        title: 'Fatal crash on Webhook signature verification in Node 20 runtime',
        body: 'When receiving GitHub webhook events under Node 20.10, the crypto buffer verification throws UnhandledPromiseRejection: Invalid key length.\n\nStack trace:\nError: Invalid key length\n  at createHmac (node:crypto:672:3)\n  at verifyWebhook (/app/src/lib/github.js:142:10)',
        url: 'https://github.com/ayushg-1506/snooze-agent/issues/42',
        author: 'octocat-dev',
        authorAvatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
        state: 'open',
        labels: ['🐛 bug', '🔴 critical'],
        commentsCount: 3,
        createdAt: new Date(now - 3 * 3600000),
        updatedAt: new Date(now - 1 * 3600000),
        triage: {
          category: 'bug',
          categoryConfidence: 0.98,
          priority: 'critical',
          priorityConfidence: 0.95,
          sentiment: 'frustrated',
          summary: 'Node 20 runtime crypto buffer error in webhook HMAC verification crashing the process.',
          reasoning: 'Critical severity due to fatal uncaught exception and production process crash during webhook ingestion.',
          draftResponse: 'Thanks for reporting this and providing the stack trace. The HMAC key buffer handling in Node 20 has stricter typing requirements. A fix is being prepared with a fallback string-to-buffer conversion.',
          duplicates: [],
          suggestedLabels: ['🐛 bug', '🔴 critical'],
          labelsApplied: true,
          responsePosted: false,
          triagedAt: new Date(now - 2 * 3600000),
        },
      },
      {
        githubId: 1002,
        repoFullName: 'ayushg-1506/snooze-agent',
        number: 43,
        title: 'Feature request: Slack and Discord morning briefing digest webhook',
        body: 'Would love if Snooze Agent could push the generated morning briefing markdown directly into a designated Slack or Discord channel at 8:00 AM every morning! That way our team does not even have to log in.',
        url: 'https://github.com/ayushg-1506/snooze-agent/issues/43',
        author: 'sarah-codes',
        authorAvatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
        state: 'open',
        labels: ['✨ feature', '🟡 medium priority'],
        commentsCount: 1,
        createdAt: new Date(now - 6 * 3600000),
        updatedAt: new Date(now - 4 * 3600000),
        triage: {
          category: 'feature',
          categoryConfidence: 0.96,
          priority: 'medium',
          priorityConfidence: 0.91,
          sentiment: 'positive',
          summary: 'Request for scheduled morning briefing dispatch to Slack and Discord webhooks.',
          reasoning: 'Constructive feature request that extends notification reach; clear value proposition.',
          draftResponse: 'Fantastic idea! Pushing the morning digest straight to a team Slack or Discord channel fits the lazy sloth philosophy perfectly. We can add this to the v1.2 webhook integrations list.',
          duplicates: [],
          suggestedLabels: ['✨ feature', '🟡 medium priority'],
          labelsApplied: true,
          responsePosted: false,
          triagedAt: new Date(now - 5 * 3600000),
        },
      },
      {
        githubId: 1003,
        repoFullName: 'ayushg-1506/snooze-agent',
        number: 44,
        title: 'Memory leak in embedding cache when syncing repos with >1000 issues',
        body: 'Observing continuous heap memory growth from 150MB to over 1.4GB during initial full sync on large repositories. Appears to be accumulating unbounded raw issue bodies.',
        url: 'https://github.com/ayushg-1506/snooze-agent/issues/44',
        author: 'perf-guru',
        authorAvatar: 'https://avatars.githubusercontent.com/u/382012?v=4',
        state: 'open',
        labels: ['🐛 bug', '🟠 high priority'],
        commentsCount: 2,
        createdAt: new Date(now - 8 * 3600000),
        updatedAt: new Date(now - 5 * 3600000),
        triage: {
          category: 'bug',
          categoryConfidence: 0.94,
          priority: 'high',
          priorityConfidence: 0.89,
          sentiment: 'neutral',
          summary: 'High memory consumption caused by unbounded issue body accumulation during batch sync.',
          reasoning: 'High priority bug that threatens container memory limits on serverless or low-RAM environments.',
          draftResponse: 'Thanks for the profiling data. We need to implement streaming chunk processing during large repository syncs rather than loading the entire issue array into RAM.',
          duplicates: [],
          suggestedLabels: ['🐛 bug', '🟠 high priority'],
          labelsApplied: true,
          responsePosted: false,
          triagedAt: new Date(now - 7 * 3600000),
        },
      },
      {
        githubId: 1004,
        repoFullName: 'ayushg-1506/snooze-agent',
        number: 45,
        title: 'Documentation for MongoDB Atlas Vector Search configuration is missing index definition',
        body: 'The README mentions Atlas Vector Search for duplicate detection, but does not provide the JSON index definition required in the Atlas Search tab.',
        url: 'https://github.com/ayushg-1506/snooze-agent/issues/45',
        author: 'alex-open',
        authorAvatar: 'https://avatars.githubusercontent.com/u/991204?v=4',
        state: 'open',
        labels: ['📝 docs', '🟢 low priority'],
        commentsCount: 0,
        createdAt: new Date(now - 14 * 3600000),
        updatedAt: new Date(now - 14 * 3600000),
        triage: {
          category: 'docs',
          categoryConfidence: 0.97,
          priority: 'low',
          priorityConfidence: 0.93,
          sentiment: 'positive',
          summary: 'Missing Atlas Vector Search index schema snippet in documentation.',
          reasoning: 'Low-friction documentation improvement with clear straightforward fix.',
          draftResponse: 'Good catch! We will add the complete Atlas Vector index JSON schema definition directly to the setup section of the README and docs today.',
          duplicates: [],
          suggestedLabels: ['📝 docs', '🟢 low priority'],
          labelsApplied: false,
          responsePosted: false,
          triagedAt: new Date(now - 13 * 3600000),
        },
      },
      {
        githubId: 1005,
        repoFullName: 'ayushg-1506/snooze-agent',
        number: 46,
        title: 'Crash on webhook event when token expires',
        body: 'When the GitHub personal access token expires, webhooks cause the server to crash with 401 unauthorized instead of gracefully catching the error.',
        url: 'https://github.com/ayushg-1506/snooze-agent/issues/46',
        author: 'sammy-tester',
        authorAvatar: 'https://avatars.githubusercontent.com/u/451290?v=4',
        state: 'open',
        labels: ['🔁 duplicate', '🟡 medium priority'],
        commentsCount: 1,
        createdAt: new Date(now - 18 * 3600000),
        updatedAt: new Date(now - 16 * 3600000),
        triage: {
          category: 'duplicate',
          categoryConfidence: 0.88,
          priority: 'medium',
          priorityConfidence: 0.82,
          sentiment: 'neutral',
          summary: 'Duplicate of #42 involving uncaught exception in webhook processing.',
          reasoning: 'Detected 87% semantic overlap with existing issue #42 error handling pipeline.',
          draftResponse: 'This appears to be related to the unhandled rejection in #42. Linking these issues together so we address both auth and runtime failures in the same patch.',
          duplicates: [
            {
              issueNumber: 42,
              issueTitle: 'Fatal crash on Webhook signature verification in Node 20 runtime',
              confidence: 0.87,
              reason: 'Overlapping webhook exception handling in same code path',
            },
          ],
          suggestedLabels: ['🔁 duplicate'],
          labelsApplied: true,
          responsePosted: false,
          triagedAt: new Date(now - 17 * 3600000),
        },
      },
    ];

    for (const issue of demoIssues) {
      await issuesCol.updateOne(
        { githubId: issue.githubId },
        { $set: issue },
        { upsert: true }
      );
    }

    // Demo activities
    const demoActivities = [
      {
        type: 'triaged',
        repoFullName: 'ayushg-1506/snooze-agent',
        issueNumber: 42,
        issueTitle: 'Fatal crash on Webhook signature verification in Node 20 runtime',
        message: 'Triaged #42 as bug (critical priority)',
        createdAt: new Date(now - 2 * 3600000),
      },
      {
        type: 'labeled',
        repoFullName: 'ayushg-1506/snooze-agent',
        issueNumber: 42,
        issueTitle: 'Fatal crash on Webhook signature verification in Node 20 runtime',
        message: 'Applied labels to #42: 🐛 bug, 🔴 critical',
        createdAt: new Date(now - 2 * 3600000 + 15000),
      },
      {
        type: 'triaged',
        repoFullName: 'ayushg-1506/snooze-agent',
        issueNumber: 43,
        issueTitle: 'Feature request: Slack and Discord morning briefing digest webhook',
        message: 'Triaged #43 as feature (medium priority)',
        createdAt: new Date(now - 5 * 3600000),
      },
      {
        type: 'triaged',
        repoFullName: 'ayushg-1506/snooze-agent',
        issueNumber: 44,
        issueTitle: 'Memory leak in embedding cache when syncing repos with >1000 issues',
        message: 'Triaged #44 as bug (high priority)',
        createdAt: new Date(now - 7 * 3600000),
      },
      {
        type: 'sync_complete',
        repoFullName: 'ayushg-1506/snooze-agent',
        message: 'Synced ayushg-1506/snooze-agent: 5 issues triaged overnight while you slept.',
        createdAt: new Date(now - 7 * 3600000 + 60000),
      },
    ];

    for (const act of demoActivities) {
      await activitiesCol.insertOne(act);
    }

    return NextResponse.json({ message: 'Loaded rich demo dataset successfully!' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
