# Vantage — AI for Every Campus Brain

**Vantage** is a neurodivergent-first academic companion that turns course syllabi into personalised task lists, proactively surfaces deadlines, and guides students through complex university forms. Built with **IBM Granite** and **Watsonx** for the IBM SkillsBuild Hackathon 2026.

---

## Features

| Feature | Description |
|--------|-------------|
| **Syllabus → Tasks** | Upload any course syllabus PDF; Vantage extracts assignments, exams, and deadlines and turns them into a prioritised, personalised task list. |
| **Neurodivergent-first** | Adapts colours, fonts, layout density, and motion to how your brain works best (ADHD, dyslexia, ASD, anxiety, sensory sensitivities). |
| **Cognitive Assist Profile (CAP)** | Onboarding questionnaire captures preferences (information density, time horizon, sensory flags, support level) and persists them for the whole experience. |
| **Priority Engine** | Tasks are ranked by due date, effort, and your CAP time horizon so you always know what to focus on next. |
| **Campus Map** | Find buildings, classrooms, dining halls, and accessibility routes; get directions and opening hours (Mapbox). |
| **Form Agent** | Step-by-step guidance through forms (e.g. FAFSA verification); collects responses and offers a downloadable summary. |
| **Canvas Integration** | Optional import of courses from Canvas LMS (API routes provided). |

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **AI:** IBM Granite (Watsonx) for syllabus parsing and assignment translation
- **Auth & DB:** [Supabase](https://supabase.com/) (Google OAuth, `cap_profiles` and related tables)
- **Storage:** IBM Cloud Object Storage (COS) for syllabus PDFs
- **PDF:** `pdf-parse` for text extraction, `jspdf` for exports
- **Maps:** Mapbox GL for campus map and directions
- **Styling:** Tailwind CSS, IBM Plex Sans, custom theme (light/dark)

---

## Prerequisites

- **Node.js** 18+
- **npm** (or yarn / pnpm)
- Accounts (free tiers work):
  - [Supabase](https://supabase.com/) — project URL and anon key
  - [IBM Cloud](https://cloud.ibm.com/) — API key, Watsonx project ID, optional COS bucket
  - [Mapbox](https://www.mapbox.com/) — public token (for campus map)

---

## Installation

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd IBMHack
   npm install
   ```

2. **Environment variables**

   Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with:

   | Variable | Description |
   |----------|-------------|
   | `IBM_API_KEY` | IBM Cloud API key (for Watsonx / Granite) |
   | `WATSONX_URL` | Watsonx API base URL (e.g. `https://us-south.ml.cloud.ibm.com`) |
   | `WATSONX_PROJECT_ID` | Watsonx project ID |
   | `IBM_COS_ENDPOINT` | IBM COS endpoint (e.g. `https://s3.us-south.cloud-object-storage.appdomain.cloud`) |
   | `IBM_COS_API_KEY` | COS API key (optional in dev; uploads are stubbed) |
   | `IBM_COS_BUCKET` | COS bucket name (e.g. `vantage-syllabi`) |
   | `IBM_COS_INSTANCE_ID` | COS service instance ID |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
   | `NEXT_PUBLIC_MAPBOX_API_TOKEN` | Mapbox public access token (campus map) |

   In development, COS can be left as placeholders; the app will log uploads and use local/cache behaviour.

3. **Supabase setup**

   - Create a Supabase project and enable **Google** provider in Authentication.
   - Add a table for CAP profiles (e.g. `cap_profiles` with `user_id`, `display_name`, `information_density`, `time_horizon`, `sensory_flags`, `support_level`, etc.) and any tables you use for syllabi/tasks. Ensure RLS policies allow authenticated users to read/write their own rows.

---

## Running the App

```bash
# Development
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start

# Lint
npm run lint
```

---

## Project Structure

```
├── app/
│   ├── page.jsx              # Landing (sign-in with Google)
│   ├── layout.jsx             # Root layout, theme, fonts
│   ├── onboarding/           # CAP questionnaire → dashboard
│   ├── dashboard/             # Task list, syllabi, agent alert
│   ├── upload/                # Syllabus PDF upload (multi-file)
│   ├── syllabus/[id]/         # Single syllabus view
│   ├── agent/                 # Form-completion flow (e.g. FAFSA)
│   ├── campus-map/            # Campus map (Mapbox)
│   ├── financial-aid/        # Financial aid–related UI
│   ├── auth/callback/        # OAuth callback (Supabase)
│   └── api/
│       ├── health/            # Health check
│       ├── cap/               # POST: build & save CAP from answers
│       ├── agent/             # Form metadata / alerts
│       ├── syllabus/
│       │   ├── upload/        # PDF upload, parse, translate, store
│       │   ├── translate/     # Translate raw text with CAP
│       │   └── [id]/original/ # Serve original PDF
│       ├── canvas/            # Canvas LMS courses & import
│       └── ui-config/         # UI configuration (e.g. theme)
├── components/
│   ├── Navbar.jsx
│   ├── TaskCard.jsx
│   ├── AgentAlert.jsx
│   ├── LoadingStages.jsx
│   ├── ErrorState.jsx
│   ├── DemoReset.jsx
│   └── ThemeProvider.jsx
├── lib/
│   ├── granite/               # IBM Granite pipeline
│   │   ├── index.js           # translateSyllabus(rawText, capProfile)
│   │   ├── parser.js          # Extract syllabus structure from text
│   │   ├── cap.js             # Translate assignments per CAP
│   │   ├── client.js          # Watsonx API client
│   │   └── prompts.js
│   ├── cap/
│   │   ├── engine.js          # buildCAP(answers)
│   │   └── questions.js       # CAP_QUESTIONS
│   ├── supabase/              # Browser & server Supabase clients
│   ├── cos.js                 # IBM COS upload (stub in dev)
│   ├── session-store.js       # In-memory syllabus cache
│   └── useUIConfig.js
└── scripts/                   # Optional: demo PDFs, cache, tests
```

---

## API Overview

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/cap` | POST | Build CAP from onboarding answers; save to Supabase |
| `/api/syllabus/upload` | POST | Upload PDF, extract text, translate with CAP, store |
| `/api/syllabus/translate` | POST | Translate raw syllabus text using CAP |
| `/api/syllabus/[id]/original` | GET | Serve original uploaded PDF |
| `/api/agent` | GET | Agent/form alert metadata for dashboard |
| `/api/canvas/courses` | GET | Canvas courses (if configured) |
| `/api/canvas/import` | POST | Import from Canvas |
| `/api/ui-config` | GET | UI config (e.g. theme) |

---

## Syllabus Pipeline

1. **Upload** — User uploads a syllabus PDF (via `/upload` or API).
2. **Extract** — `pdf-parse` gets raw text; `lib/granite/parser.js` (Granite) extracts course name, instructor, term, assignments, policies, important dates.
3. **Translate** — `lib/granite/cap.js` rewrites assignment descriptions in plain English according to the user’s CAP (information density, support level).
4. **Store** — Result is stored in session/cache and optionally in Supabase/COS; original PDF is cached on disk and served by `/api/syllabus/[id]/original`.

---

## License & Credits

- **IBM SkillsBuild Hackathon 2026**
- Powered by **IBM Granite** and **Watsonx**
- UI uses **IBM Plex Sans** and accessibility-first patterns for neurodivergent users.
