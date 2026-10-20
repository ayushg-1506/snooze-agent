import { NextResponse } from 'next/server';
import { getContributorInsights } from '@/lib/triage';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const contributors = await getContributorInsights(repo);
    return NextResponse.json({ contributors });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
