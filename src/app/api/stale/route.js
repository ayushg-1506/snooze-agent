import { NextResponse } from 'next/server';
import { getStaleIssues } from '@/lib/triage';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const days = parseInt(searchParams.get('days') || '14', 10);
    const stale = await getStaleIssues(repo, days);
    return NextResponse.json({ staleIssues: stale });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
