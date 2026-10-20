import { NextResponse } from 'next/server';
import { getCollection, connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const hasGithub = !!process.env.GITHUB_TOKEN;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemma = !!(process.env.GOOGLE_API_KEY || process.env.GEMMA_API_KEY);
  const hasMongo = !!process.env.MONGODB_URI;

  let mongoStatus = 'local_fallback';
  if (hasMongo) {
    try {
      const { isMongo } = await connectToDatabase();
      mongoStatus = isMongo ? 'connected' : 'error';
    } catch {
      mongoStatus = 'error';
    }
  }

  let aiModel = 'None (Heuristic Fallback)';
  if (hasGroq) aiModel = 'Groq: Llama 3.1 70B Versatile';
  else if (hasGemma) aiModel = `Google: ${process.env.GEMMA_MODEL || 'Gemma 2 / Gemini'}`;

  return NextResponse.json({
    integrations: {
      github: {
        status: hasGithub ? 'connected' : 'missing',
        label: 'GitHub REST API (Octokit)',
      },
      ai: {
        status: (hasGroq || hasGemma) ? 'connected' : 'fallback',
        model: aiModel,
        provider: hasGroq ? 'Groq' : (hasGemma ? 'Gemma' : 'Heuristic Engine'),
      },
      database: {
        status: mongoStatus,
        label: mongoStatus === 'connected' ? 'MongoDB Atlas' : 'Local Embedded Engine',
      },
      webhook: {
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/github`,
      },
    },
  });
}
