# 5Days — Know Your Rights Before the Clock Runs Out

> **A tenant rights tool for Chicago renters facing eviction.**  
> Paste, photograph, or describe your eviction notice. Get a plain-English analysis, a legal defect check, and an action plan — in under 60 seconds. Free, always.

---

## The Problem

In Chicago, a landlord can begin eviction proceedings with a single piece of paper. A 5-Day Notice to Pay or Quit means exactly that — five days. Not business days. Not days until you can afford a lawyer. Five calendar days from the moment the notice is served.

Landlords have property attorneys who draft these documents, who know which defenses to pre-empt, and who have been through Cook County eviction court many times. Tenants often have none of that. They have a piece of paper they don't fully understand, a deadline they can't afford to miss, and fear.

**That asymmetry — of knowledge, access, and time — is the problem 5Days was built to fix.**

Chicago files 23,000+ eviction cases per year. Most tenants don't know what their notice means. Many don't know that a procedural defect in the notice can be a complete legal defense. Almost none know the specific protections afforded by the Chicago Residential Landlord and Tenant Ordinance (RLTO) — one of the strongest tenant protection laws in the country.

5Days gives tenants the playbook that the other side already has.

---

## What It Does

### Analyze a Notice (`analyze.html`)
- Paste the notice text, upload a photo, or describe it in plain English or Spanish
- AI decodes the notice and returns a full structured analysis:
  - **Notice type** — what kind of notice this is
  - **Plain English explanation** — what it means and what happens if you do nothing
  - **Your deadline** — calculated with correct Illinois day-counting rules
  - **Your rights** — specific protections under Illinois law and the Chicago RLTO
  - **Procedural defect check** — flags errors that could be a complete legal defense
  - **3 biggest mistakes** tenants make in this specific situation
  - **Draft response letter** — ready to copy and send
  - **Action plan** — numbered checklist of exactly what to do next
- **Read aloud button** — uses browser speech synthesis, no extra API needed
- **English / Spanish toggle** — full bilingual response support
- **Image upload** — photograph your notice on your phone; OpenAI extracts and analyzes the text

### My Case Dashboard (`mycase.html`)
- **Court Date Tracker** — countdown timer to your court date + what-to-bring checklist
- **Evidence Checklist** — personalized by notice type (5-day, 10-day, 30-day, 14-day)
- **Communication Log** — log every landlord interaction with date, type, and witnesses; print as a formatted document for court

### Resources (`resources.html`)
- Curated free legal resources for Chicago tenants
- Plain-English summaries of the three laws that protect you:
  - Chicago RLTO (Municipal Code Ch. 5-12)
  - Illinois Residential Tenants Act (ILCS Ch. 765)
  - Illinois Eviction Act (735 ILCS 5/9)
- Full FAQ with accordion answers to the most common tenant questions

### Additional Pages
- **Home** (`index.html`) — animated hero, how-it-works, live case study walkthrough, asymmetry explainer
- **About** (`about.html`) — mission, story, and project background
- **Contact** (`contact.html`) — contact form + emergency legal resources

---

## The Legal Grounding

5Days is specifically anchored to:

| Law | Scope |
|---|---|
| Chicago RLTO (Municipal Code Ch. 5-12) | Applies to most Chicago rentals; stronger than state law |
| Illinois Residential Tenants Act (ILCS Ch. 765, Acts 710–735) | Statewide baseline protections |
| Illinois Eviction Act (735 ILCS 5/9-201 through 9-321) | Procedural requirements for eviction filings |

The AI is prompted to check every notice against these specific laws, flag known procedural defect patterns, and never invent statute numbers it isn't confident in.

---

## The Defect Check — Why It Matters

Many eviction notices have procedural errors. Common ones include:

- Wrong notice period for the violation type
- Notice not signed by landlord or authorized agent
- Missing required language under Chicago RLTO §5-12-130
- Improper service method (must be personal service or posted + mailed)
- Math errors in rent owed
- Notice served too soon after a prior notice

**A defective notice can be a complete legal defense** — the judge dismisses the case and the landlord must start over. Tenants almost never know to look for this. 5Days checks automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js + Express |
| AI | OpenAI API via OpenRouter |
| Vision | OCR/text extraction from uploaded images |
| Speech | Browser Web Speech API |
| Hosting | Render |
| Storage | None — no user data stored |

Additional implementation details:

- Express API server with rate limiting
- Structured AI prompting for legal consistency
- Spanish-language response support
- Static frontend served through Express
- CORS + JSON body parsing enabled
- Mobile-friendly upload flow

---

## Setup

### Run locally

```bash
git clone https://github.com/yourusername/5days.git
cd 5days
npm install
npm start
```

Then open:

```bash
http://localhost:3000
```

### Environment Variables

Create a `.env` file:

```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
```

### Project Structure

```bash
5days/
├── public/
│   ├── index.html
│   ├── analyze.html
│   ├── mycase.html
│   ├── resources.html
│   ├── about.html
│   ├── contact.html
│   ├── shared.css
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

### Get an API Key

1. Go to https://openrouter.ai/settings/keys
2. Create an account
3. Generate an API key
4. Add it to your `.env` file

Your API key is never exposed to end users and is stored only on the server.

---

## Deploy

### Render Deployment

1. Push the project to GitHub
2. Create a new Web Service on Render
3. Connect the GitHub repository
4. Add environment variable:

```env
OPENROUTER_API_KEY=your_key_here
```

5. Deploy

### Live Website

https://fivedays-3w45.onrender.com

---

## Free Legal Resources

5Days is a technology tool, not a law firm. If you are facing eviction in Chicago, please also contact:

| Resource | Contact |
|---|---|
| Chicago Eviction Help Line | 312-347-7600 |
| Metropolitan Tenants Organization | 773-292-4980 |
| Legal Aid Chicago | https://legalaidchicago.org |
| Cook County Court Self-Help | https://cookcountycourt.org/selfhelp |
| Illinois Legal Aid Online | https://illinoislegalaid.org |

---

## Disclaimer

5Days provides legal **information**, not legal **advice**. Nothing in this tool creates an attorney-client relationship. Laws and local ordinances change frequently — always verify information with a licensed Illinois attorney or legal aid organization before taking legal action.

---

## Built At

**ALI Builds 2025** — A beginner-friendly Chicago hackathon focused on social impact.

Prompt:

> *"The world's biggest companies are built on leverage. They give people access to something they previously lacked: information, speed, capital, coordination, automation, networks, or opportunity."*

We chose tenants facing eviction.

---

## Vision

5Days is designed around a simple idea:

**The people with the least legal power often face the fastest legal deadlines.**

The goal is not to replace attorneys. The goal is to give renters enough clarity, context, and immediate direction to avoid panic and make informed decisions during the first critical hours after receiving a notice.

---

*5Days — Chicago, IL · Powered by OpenAI + OpenRouter · Not a law firm*
