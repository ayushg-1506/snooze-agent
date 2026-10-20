import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/triage';

// GET /api/analytics — Analytics data for charts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo') || null;

    const data = await getAnalyticsData(repo);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
