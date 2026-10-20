import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

let groqInstance = null;
let googleGenAI = null;

function getAIProvider() {
  const groqKey = process.env.GROQ_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMMA_API_KEY;

  if (groqKey) {
    if (!groqInstance) groqInstance = new Groq({ apiKey: groqKey });
    return {
      type: 'groq',
      client: groqInstance,
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    };
  }

  if (googleKey) {
    if (!googleGenAI) googleGenAI = new GoogleGenerativeAI(googleKey);
    return {
      type: 'gemma',
      client: googleGenAI,
      model: process.env.GEMMA_MODEL || 'gemma-2-27b-it',
    };
  }

  return { type: 'none' };
}

/**
 * Triage a single GitHub issue using open-weight AI
 */
export async function triageIssue(issue) {
  const provider = getAIProvider();
  const prompt = buildTriagePrompt(issue);

  if (provider.type === 'groq') {
    try {
      const response = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: `You are Snooze Agent, an expert GitHub issue triage bot powered by open-weight AI. You MUST respond with ONLY valid JSON and nothing else.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 600,
      });
      const text = response.choices[0]?.message?.content || '{}';
      const cleanJson = extractJSON(text);
      return normalizeTriageResult(JSON.parse(cleanJson));
    } catch (err) {
      console.warn('Groq triage failed, falling back:', err.message);
    }
  }

  if (provider.type === 'gemma') {
    try {
      const model = provider.client.getGenerativeModel({ model: provider.model });
      const result = await model.generateContent(
        `System: You are Snooze Agent, an expert open-source triage assistant. Respond with ONLY JSON.\n\n${prompt}`
      );
      const text = result.response.text();
      return normalizeTriageResult(JSON.parse(extractJSON(text)));
    } catch (err) {
      console.warn('Gemma triage failed, falling back:', err.message);
    }
  }

  return heuristicTriage(issue);
}

/**
 * Generate a draft response for an issue
 */
export async function generateResponse(issue, triageResult) {
  const provider = getAIProvider();
  const prompt = `You are a helpful open-source maintainer waking up to review this issue. Write a concise, empathetic response (3-4 sentences). Do NOT start with generic fluff like "Thank you for reaching out".
Issue Title: ${issue.title}
Body: ${truncate(issue.body, 1200)}
Category: ${triageResult.category} | Priority: ${triageResult.priority} | Sentiment: ${triageResult.sentiment}
Summary: ${triageResult.summary}`;

  if (provider.type === 'groq') {
    try {
      const res = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 350,
      });
      return res.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.warn('Groq draft error:', e.message);
    }
  }

  if (provider.type === 'gemma') {
    try {
      const model = provider.client.getGenerativeModel({ model: provider.model });
      const res = await model.generateContent(prompt);
      return res.response.text().trim();
    } catch (e) {}
  }

  // Template-based fallback
  if (triageResult.category === 'bug') {
    return `Thanks for catching this. I have flagged this bug as ${triageResult.priority} priority. Could you verify your environment details (OS, Node version) and a minimal reproduction snippet? We will take a look.`;
  } else if (triageResult.category === 'feature') {
    return `Appreciate the suggestion! This is an interesting feature idea. We will evaluate how this aligns with the current roadmap and discuss the implementation scope with the team.`;
  }
  return `Thanks for bringing this up. We have queued this up for triage and will review the details shortly. Feel free to add any additional context or logs in the meantime.`;
}

/**
 * Generate morning briefing
 */
export async function generateBriefing(issuesSummary) {
  const provider = getAIProvider();
  const prompt = `You are Snooze Agent (a sloth-themed AI that triaged GitHub overnight so the maintainer could sleep).
Write a 2-paragraph morning briefing based on this overnight activity:
${issuesSummary}
Tone: Relaxed, sharp, helpful sloth. Mention high-priority issues first, note overall issue volume, and end with an encouraging word for the day.`;

  if (provider.type === 'groq') {
    try {
      const res = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 450,
      });
      return res.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.warn('Groq briefing error:', e.message);
    }
  }

  if (provider.type === 'gemma') {
    try {
      const model = provider.client.getGenerativeModel({ model: provider.model });
      const res = await model.generateContent(prompt);
      return res.response.text().trim();
    } catch (e) {}
  }

  return `Good morning! 🦥 While you were sleeping soundly, Snooze Agent scanned your issue queue. All incoming issues have been categorized, prioritized, and had initial responses drafted. Check the critical issues section below to see what needs attention first today!`;
}

/**
 * Duplicate detector
 */
export async function findDuplicates(title, body, existingIssues) {
  if (!existingIssues || existingIssues.length === 0) return [];
  const words = (title + ' ' + (body || '')).toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const wordSet = new Set(words);

  const matched = [];
  for (const existing of existingIssues) {
    const existingWords = (existing.title + ' ' + (existing.body || ''))
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    let common = 0;
    for (const w of existingWords) {
      if (wordSet.has(w)) common++;
    }
    const score = common / Math.max(existingWords.length, 1);
    if (score > 0.35 || (existing.title.toLowerCase().includes(title.toLowerCase()) && title.length > 8)) {
      matched.push({
        issueNumber: existing.number,
        issueTitle: existing.title,
        confidence: Math.min(0.95, Math.round(score * 100) / 100 + 0.3),
        reason: `Shares multiple key technical terms and intent with #${existing.number}`,
      });
    }
  }
  return matched.slice(0, 3);
}

function extractJSON(str) {
  const match = str.match(/\{[\s\S]*\}/);
  return match ? match[0] : str;
}

function buildTriagePrompt(issue) {
  return `Analyze this GitHub issue and return ONLY a valid JSON object:
Title: ${issue.title}
Body: ${truncate(issue.body || 'No description', 2500)}
Author: ${issue.user?.login || issue.author || 'unknown'}

Required JSON Schema:
{
  "category": "bug" | "feature" | "question" | "docs" | "duplicate" | "enhancement",
  "categoryConfidence": 0.0 to 1.0,
  "priority": "critical" | "high" | "medium" | "low",
  "priorityConfidence": 0.0 to 1.0,
  "sentiment": "frustrated" | "neutral" | "positive",
  "summary": "1 sentence executive summary under 120 chars",
  "reasoning": "brief explanation"
}`;
}

function normalizeTriageResult(result) {
  const categories = ['bug', 'feature', 'question', 'docs', 'duplicate', 'enhancement'];
  const priorities = ['critical', 'high', 'medium', 'low'];
  const sentiments = ['frustrated', 'neutral', 'positive'];

  return {
    category: categories.includes(result.category) ? result.category : 'question',
    categoryConfidence: Math.min(1, Math.max(0.1, result.categoryConfidence || 0.85)),
    priority: priorities.includes(result.priority) ? result.priority : 'medium',
    priorityConfidence: Math.min(1, Math.max(0.1, result.priorityConfidence || 0.8)),
    sentiment: sentiments.includes(result.sentiment) ? result.sentiment : 'neutral',
    summary: (result.summary || 'Issue triaged by Snooze Agent').slice(0, 160),
    reasoning: result.reasoning || 'Classified based on keywords and description.',
  };
}

function heuristicTriage(issue) {
  const content = (issue.title + ' ' + (issue.body || '')).toLowerCase();
  let category = 'question';
  let priority = 'medium';
  let sentiment = 'neutral';

  if (content.match(/crash|error|exception|fail|broken|bug|reproduce|traceback|undefined/)) {
    category = 'bug';
  } else if (content.match(/feature|request|suggest|would be great|proposal|idea/)) {
    category = 'feature';
  } else if (content.match(/doc|readme|typo|guide|tutorial/)) {
    category = 'docs';
  } else if (content.match(/improve|optimize|refactor|performance/)) {
    category = 'enhancement';
  }

  if (content.match(/critical|security|vulnerability|leak|data loss|urgent|production down/)) {
    priority = 'critical';
  } else if (category === 'bug' && content.match(/cannot|blocking|fatal/)) {
    priority = 'high';
  } else if (category === 'docs') {
    priority = 'low';
  }

  if (content.match(/angry|frustrated|terrible|still broken|!{2,}/)) {
    sentiment = 'frustrated';
  } else if (content.match(/love|great|awesome|thank you|appreciate/)) {
    sentiment = 'positive';
  }

  return {
    category,
    categoryConfidence: 0.9,
    priority,
    priorityConfidence: 0.85,
    sentiment,
    summary: (issue.title || 'Incoming issue').slice(0, 140),
    reasoning: 'Heuristic keyword parsing and sentiment analysis applied.',
  };
}

function truncate(text, max) {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max) + '...';
}
