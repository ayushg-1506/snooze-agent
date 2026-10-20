# 🦥 Snooze Agent

> **The Autonomous GitHub Issue Triage Bot for Lazy Maintainers — Built with Open-Weight AI (Gemma 2 & Llama 3.1).**  
> *Submission for Hacktoberfest Open-Source AI Challenge: Week 3 ("Slow and Steady").*

---

## 💡 What is Snooze Agent?

Sloths move slowly, conserve energy, and let the world turn at its own pace.  
Open-source maintainers, however, are constantly bombarded by issues, bug reports, feature requests, and angry comments at 2 AM.

**Snooze Agent flips the script.**  
It is an autonomous agent running on open-weight AI that watches your GitHub repositories overnight. While you sleep:
1. **Classifies every new issue** into categories (`bug`, `feature`, `question`, `docs`, `duplicate`, `enhancement`) with confidence scoring.
2. **Assigns Urgency Priorities** (`critical`, `high`, `medium`, `low`) using sentiment analysis and stack-trace detection.
3. **Detects Duplicates** using semantic text overlap before you spend hours investigating.
4. **Drafts Empathetic, Context-Aware Maintainer Responses** ready for 1-click review or automated posting.
5. **Generates a Morning Briefing Digest**: Wake up, sip your coffee, and read a friendly 2-minute overview of what actually needs your attention.

---

## 🏆 Hacktoberfest Prize Categories Targeted

- 🌟 **Slow and Steady (Top Prize)**: Embodies the theme of open-weight AI rewarding laziness and removing maintainer burnout.
- 💎 **Best Use of Gemma ($200)**: Powered by Google's open-weight `gemma-2-27b-it` model for reasoning, classification, and response drafting.
- 🍃 **Best Use of MongoDB Atlas ($100)**: Database layer for issues, triage metadata, and duplicate search.
- ⚡ **Best Use of Render ($200)**: Full-stack Next.js deployment with real-time GitHub webhook ingestion.
- 🌐 **Best Use of a .tech Domain ($100)**: Configured for custom domain deployment.

---

## 🛠️ Tech Stack & Open-Source AI Core

- **Frontend & App Framework**: Next.js 16 (App Router) + Vanilla CSS Glassmorphism Design System (No generic Tailwind slop).
- **Open-Weight AI Models**:
  - Google Gemma 2 (`gemma-2-27b-it`)
  - Meta Llama 3.1 70B (`llama-3.1-70b-versatile` via Groq)
- **GitHub Integration**: Octokit REST API + Live Webhook Receiver (`/api/webhooks/github`).
- **Data Layer**: Dual-mode engine — MongoDB Atlas + Zero-config local resilient fallback.
- **Visuals**: Recharts dynamic velocity and category distribution analytics.

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/ayushg-1506/snooze-agent.git
cd snooze-agent
npm install
```

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file:
```env
# GitHub Personal Access Token (classic with 'repo' scope)
GITHUB_TOKEN=your_github_token

# Google Gemma (Open-Weight Model)
GOOGLE_API_KEY=your_google_api_key
GEMMA_MODEL=gemma-2-27b-it

# Optional: Groq API Key (for Llama 3.1 70B)
GROQ_API_KEY=

# Optional: MongoDB Atlas Connection String (falls back to local database if blank)
MONGODB_URI=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌟 Key Features

| Section | What It Delivers |
|---|---|
| 🦥 **Dashboard** | Morning briefing card, maintainer time-saved meter, urgent issues alerts, and live activity feed. |
| 📋 **Issues Queue** | Full triage view with filter by category/priority/sentiment, AI reasoning modal, 1-click apply labels, and draft responses. |
| 📊 **Analytics** | Issue velocity area charts, classification donut breakdown, priority bar charts, and contributor leaderboard. |
| 📂 **Repositories** | Connect GitHub repos (`owner/repo`), manual "Run Triage Now", webhook endpoint instructions. |
| ⚙️ **Settings & Diagnostics** | Real-time status indicators for GitHub, Gemma/Llama runtime, and Database. Includes 1-click **"Populate Demo Issues"** to test immediately. |

---

*Made with 💜 and sloth-level tranquility for Hacktoberfest 2026.*
