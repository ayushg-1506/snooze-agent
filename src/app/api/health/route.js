import { NextResponse } from 'next/server';
import { calculateRepoHealth } from '@/lib/triage';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const health = await calculateRepoHealth(repo);
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
