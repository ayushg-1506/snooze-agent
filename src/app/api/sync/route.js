import { NextResponse } from 'next/server';
import { triageRepository } from '@/lib/triage';

// POST /api/sync — Trigger sync/triage for a repo
export async function POST(request) {
  try {
    const body = await request.json();
    const { repoFullName } = body;

    if (!repoFullName) {
      return NextResponse.json(
        { error: 'repoFullName is required' },
        { status: 400 }
      );
    }

    const results = await triageRepository(repoFullName);

    return NextResponse.json({
      message: `Triage complete for ${repoFullName}`,
      results,
    });
  } catch (error) {
    console.error('Error syncing repo:', error);
    return NextResponse.json(
      { error: 'Triage failed', details: error.message },
      { status: 500 }
    );
  }
}
