import { NextResponse } from 'next/server';
import { getCollection, initializeDatabase } from '@/lib/mongodb';
import { fetchRepoDetails } from '@/lib/github';

// GET /api/repos — List connected repos
export async function GET() {
  try {
    await initializeDatabase();
    const reposCol = await getCollection('repos');
    const repos = await reposCol.find({}).sort({ createdAt: -1 }).toArray();

    // Serialize ObjectId
    const serialized = repos.map((r) => ({
      ...r,
      _id: r._id.toString(),
    }));

    return NextResponse.json({ repos: serialized });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repos', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/repos — Connect a new repo
export async function POST(request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { fullName } = body;

    if (!fullName || !fullName.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid repository name. Use format: owner/repo' },
        { status: 400 }
      );
    }

    const [owner, repo] = fullName.split('/');

    // Verify the repo exists on GitHub
    let ghRepo;
    try {
      ghRepo = await fetchRepoDetails(owner, repo);
    } catch {
      return NextResponse.json(
        { error: `Repository "${fullName}" not found on GitHub or not accessible` },
        { status: 404 }
      );
    }

    const reposCol = await getCollection('repos');

    // Check if already connected
    const existing = await reposCol.findOne({ fullName });
    if (existing) {
      return NextResponse.json(
        { error: 'Repository already connected' },
        { status: 409 }
      );
    }

    const repoDoc = {
      owner,
      name: repo,
      fullName,
      githubId: ghRepo.id,
      description: ghRepo.description || '',
      stars: ghRepo.stargazers_count,
      forks: ghRepo.forks_count,
      language: ghRepo.language,
      openIssuesCount: ghRepo.open_issues_count,
      avatarUrl: ghRepo.owner?.avatar_url || '',
      settings: {
        autoLabel: false,
        autoRespond: false,
        syncInterval: '6h',
      },
      lastSynced: null,
      createdAt: new Date(),
    };

    await reposCol.insertOne(repoDoc);

    return NextResponse.json({
      message: `Connected ${fullName}`,
      repo: { ...repoDoc, _id: repoDoc._id?.toString() },
    });
  } catch (error) {
    console.error('Error connecting repo:', error);
    return NextResponse.json(
      { error: 'Failed to connect repository', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/repos — Disconnect a repo
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fullName = searchParams.get('fullName');

    if (!fullName) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 });
    }

    const reposCol = await getCollection('repos');
    const issuesCol = await getCollection('issues');
    const activitiesCol = await getCollection('activities');

    // Remove repo and all associated data
    await Promise.all([
      reposCol.deleteOne({ fullName }),
      issuesCol.deleteMany({ repoFullName: fullName }),
      activitiesCol.deleteMany({ repoFullName: fullName }),
    ]);

    return NextResponse.json({ message: `Disconnected ${fullName}` });
  } catch (error) {
    console.error('Error disconnecting repo:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect repository', details: error.message },
      { status: 500 }
    );
  }
}
