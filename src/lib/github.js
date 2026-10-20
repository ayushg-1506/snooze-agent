import { Octokit } from 'octokit';

let octokitInstance = null;

export function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Please define the GITHUB_TOKEN environment variable in .env.local');
  }
  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return octokitInstance;
}

/**
 * Fetch all open issues for a given repo
 */
export async function fetchRepoIssues(owner, repo, since = null) {
  const octokit = getOctokit();
  const params = {
    owner,
    repo,
    state: 'open',
    per_page: 100,
    sort: 'updated',
    direction: 'desc',
  };

  if (since) {
    params.since = since;
  }

  const issues = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.rest.issues.listForRepo({
      ...params,
      page,
    });

    // Filter out pull requests (GitHub API returns PRs with issues)
    const realIssues = data.filter((issue) => !issue.pull_request);
    issues.push(...realIssues);

    if (data.length < 100) break;
    page++;
    if (page > 10) break; // Safety limit
  }

  return issues;
}

/**
 * Fetch a single issue with comments
 */
export async function fetchIssueWithComments(owner, repo, issueNumber) {
  const octokit = getOctokit();

  const [issueRes, commentsRes] = await Promise.all([
    octokit.rest.issues.get({ owner, repo, issue_number: issueNumber }),
    octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 30,
    }),
  ]);

  return {
    issue: issueRes.data,
    comments: commentsRes.data,
  };
}

/**
 * Add labels to an issue on GitHub
 */
export async function addLabelsToIssue(owner, repo, issueNumber, labels) {
  const octokit = getOctokit();

  // First, ensure the labels exist on the repo
  for (const label of labels) {
    try {
      await octokit.rest.issues.getLabel({ owner, repo, name: label.name });
    } catch {
      // Create it with a color
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color || '8b5cf6',
        description: label.description || `Auto-created by Snooze Agent`,
      });
    }
  }

  // Apply labels
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: labels.map((l) => l.name),
  });
}

/**
 * Post a comment on a GitHub issue
 */
export async function postComment(owner, repo, issueNumber, body) {
  const octokit = getOctokit();
  const result = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `${body}\n\n---\n*🦥 This response was drafted by [Snooze Agent](https://github.com/ayushg-1506/snooze-agent) — an AI-powered triage bot that works while you sleep.*`,
  });
  return result.data;
}

/**
 * Fetch repo details (stars, forks, etc.)
 */
export async function fetchRepoDetails(owner, repo) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

/**
 * Fetch repo contributors
 */
export async function fetchContributors(owner, repo) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 30,
    });
    return data;
  } catch {
    return [];
  }
}

/**
 * Label color mapping
 */
export const LABEL_COLORS = {
  // Categories
  bug: { name: '🐛 bug', color: 'f43f5e', description: 'Something is broken' },
  feature: { name: '✨ feature', color: '8b5cf6', description: 'New feature request' },
  question: { name: '❓ question', color: '38bdf8', description: 'Further information is requested' },
  docs: { name: '📝 docs', color: '10b981', description: 'Documentation improvement' },
  duplicate: { name: '🔁 duplicate', color: '6b7280', description: 'This issue already exists' },
  enhancement: { name: '🔧 enhancement', color: 'f59e0b', description: 'Improvement to existing functionality' },

  // Priority
  critical: { name: '🔴 critical', color: 'dc2626', description: 'Needs immediate attention' },
  high: { name: '🟠 high priority', color: 'f59e0b', description: 'High priority issue' },
  medium: { name: '🟡 medium priority', color: '38bdf8', description: 'Medium priority issue' },
  low: { name: '🟢 low priority', color: '10b981', description: 'Low priority issue' },
};
