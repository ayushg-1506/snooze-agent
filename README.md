# 🦥 Snooze Agent

> **The Autonomous GitHub Issue Triage Bot for Lazy Maintainers.**  
> *Built with Open-Weight AI (Qwen, Llama 3.1 & Google Gemma) · Powered by MongoDB Atlas & Groq.*  
> *Submission for Hacktoberfest Open-Source AI Challenge: Week 3 ("Slow and Steady").*

---

## 📸 Interface Preview

### The Morning Dossier (Overnight Executive Dispatch)
![The Morning Dossier](public/screenshots/morning-dossier.png)

### Patterns & Velocity (Open-Weight AI Analytics)
![Patterns & Velocity Analytics](public/screenshots/patterns-velocity.png)

---

## 💡 What is Snooze Agent?

Sloths move slowly, conserve their energy, and let the world turn at its own pace.  
Open-source maintainers, however, are constantly bombarded by issues, bug reports, feature requests, and panic notifications in the middle of the night.

**Snooze Agent channels the sloth philosophy:**  
Instead of waking up to an overwhelming notification queue, you sleep soundly. Snooze Agent operates autonomously overnight using **open-weight AI models** to:

1. **Ingest & Classify**: Categorizes issues (`bug`, `feature`, `question`, `docs`, `duplicate`, `enhancement`) with calibrated confidence scores.
2. **Assign Urgency & Sentiment**: Detects production crashes, fatal unhandled rejections, and user frustration levels to prioritize what actually matters.
3. **Detect Duplicates**: Performs semantic text matching across open issues to flag duplicate reports before maintainers waste hours investigating.
4. **Draft Empathetic Maintainer Responses**: Generates context-aware, constructive responses ready for 1-click publishing to GitHub.
5. **Publish The Morning Dossier**: Wake up, sip coffee, and review a tranquil, 2-minute executive digest of overnight activity.

---

## 🏆 Hacktoberfest Prize Categories Targeted

| Category | Why Snooze Agent Qualifies | Prize Value |
|---|---|---|
| 🦥 **Slow and Steady (Top Prize)** | Directly embodies the sloth theme: rewards maintainer laziness and eliminates notification anxiety using open AI. | **$250 + DEV++** |
| ⚡ **Best Use of Render** | Production-ready full-stack Next.js app hosted on Render with live GitHub webhook ingestion. | **$200** |
| 💎 **Best Use of Gemma** | Zero-shot issue classification, reasoning, and response generation powered by open-weight models. | **$200** |
| 🍃 **Best Use of MongoDB Atlas** | Cloud database storing triage dossiers, issue metadata, and duplicate search clusters. | **$100** |
| 🌐 **Best Use of a .tech Domain** | Pre-configured for custom domain routing and SSL webhooks. | **$100** |

---

## 🌿 Design Aesthetics: Nordic Sage & Espresso

Built with a bespoke **Morning Dossier** aesthetic inspired by modern editorial print craft:
- **Palette**: Calming Nordic sage (`#4A6B57`), organic moss (`#1B2E24`), natural linen canvas (`#F5F2EB`), and deep espresso typography (`#1A1A18`).
- **Dark Mode**: High-contrast Nordic Obsidian & Forest Night mode with smooth 1-click toggle.
- **Craft**: Zero generic AI slop. Crisp 1px rule borders, editorial Newsreader italics, and monospace JetBrains data stamps.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + Vanilla CSS Modules & Tokens
- **Open-Weight AI**: Groq API (`qwen/qwen3.8-27b` / `llama-3.1-70b`) & Google Gemma 2 (`gemma-2-27b-it`)
- **Database**: MongoDB Atlas M0 (with resilient local storage fallback)
- **GitHub Integration**: Octokit REST API + Live Webhook Receiver (`/api/webhooks/github`)
- **Charts**: Recharts dynamic velocity and category distribution
- **Deployment**: Render Web Service

---

## 🚀 Getting Started Locally

### 1. Clone & Install
```bash
git clone https://github.com/ayushg-1506/snooze-agent.git
cd snooze-agent
npm install
```

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file with your credentials:
```env
# GitHub Personal Access Token (classic with 'repo' scope)
GITHUB_TOKEN=ghp_your_github_token

# Groq API Key (for open-weight model inference)
GROQ_API_KEY=gsk_your_groq_api_key

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority

# Optional: Google Gemma / Gemini Key
GOOGLE_API_KEY=your_google_api_key
GEMMA_MODEL=gemma-2-27b-it

NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_WEBHOOK_SECRET=snooze-agent-webhook-secret
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deploying to Render

### Step 1: Create a New Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New → Web Service**.
2. Connect your GitHub repository: `ayushg-1506/snooze-agent`.

### Step 2: Configure Build & Start Commands
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Step 3: Add Environment Variables on Render
Under **Environment Variables**, add:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `GROQ_API_KEY`: Your Groq API key
- `MONGODB_URI`: Your MongoDB Atlas connection URI
- `GOOGLE_API_KEY`: Your Google Gemma API key
- `NEXT_PUBLIC_APP_URL`: Your Render service URL (e.g., `https://snooze-agent.onrender.com`)

Click **Deploy**!

---

## 🪝 Setting Up GitHub Webhooks (Real-Time Ingestion)

To have Snooze Agent automatically triage issues the moment they are opened:
1. Open your GitHub Repository → **Settings** → **Webhooks** → **Add webhook**.
2. **Payload URL**: `https://your-app.onrender.com/api/webhooks/github`
3. **Content type**: `application/json`
4. **Which events?**: Select **"Let me select individual events"** → Check **Issues**.
5. Save webhook. Snooze Agent will now triage incoming issues instantly.

---

## 📂 Project Structure

```
snooze-agent/
├── public/
│   ├── favicon.svg              # Custom sloth favicon
│   └── screenshots/             # Readme interface previews
│       ├── morning-dossier.png
│       └── patterns-velocity.png
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/       # Chart data aggregation
│   │   │   ├── briefing/        # AI morning dispatch generator
│   │   │   ├── contributors/    # Contributor insights
│   │   │   ├── demo/            # 1-click evaluation dataset seeder
│   │   │   ├── health/          # Repository health score calculator
│   │   │   ├── issues/          # Filtered issue queue & action handler
│   │   │   ├── repos/           # Monitored repo management
│   │   │   ├── settings/        # System diagnostics
│   │   │   ├── stale/           # Stale issue detector
│   │   │   ├── sync/            # Full overnight triage pipeline
│   │   │   └── webhooks/github/ # Live GitHub issue event receiver
│   │   ├── analytics/           # Visual pattern & velocity dashboard
│   │   ├── issues/              # Issue inspection & draft review modal
│   │   ├── repos/               # Connected repositories page
│   │   ├── settings/            # Runtime diagnostics & demo actions
│   │   ├── globals.css          # Nordic Sage & Espresso design tokens
│   │   ├── layout.js            # Root layout with theme & sloth favicon
│   │   └── page.js              # The Morning Dossier main view
│   ├── components/
│   │   ├── AppShell.js          # Navigation & dark mode controller
│   │   └── ToastContainer.js    # Notification toast system
│   └── lib/
│       ├── ai.js                # Groq (Qwen/Llama) & Gemma triage engine
│       ├── github.js            # Octokit REST API wrapper
│       ├── mongodb.js           # Atlas connection with local fallback
│       └── triage.js            # Autonomous triage orchestration
└── README.md
```

---

*Crafted with 🦥 tranquil patience for Hacktoberfest 2026.*
