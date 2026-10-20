import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// GET /api/issues — List triaged issues with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const state = searchParams.get('state') || 'open';
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const issuesCol = await getCollection('issues');

    // Build query
    const query = {};
    if (repo) query.repoFullName = repo;
    if (category) query['triage.category'] = category;
    if (priority) query['triage.priority'] = priority;
    if (state && state !== 'all') query.state = state;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort
    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'priority') sortObj = { 'triage.priorityScore': -1, createdAt: -1 };
    if (sort === 'updated') sortObj = { updatedAt: -1 };

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      issuesCol
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray(),
      issuesCol.countDocuments(query),
    ]);

    // Serialize
    const serialized = issues.map((issue) => ({
      ...issue,
      _id: issue._id.toString(),
    }));

    return NextResponse.json({
      issues: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: error.message },
      { status: 500 }
    );
  }
}
