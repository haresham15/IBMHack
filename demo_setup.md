# Vantage — Demo Setup Guide

## Quick Start

1. Copy `.env.example` to `.env.local` and fill in your IBM API key and WatsonX project ID
2. Install dependencies: `npm install`
3. Cache the demo syllabi: `node scripts/cache_demo_syllabi.mjs`
4. Start the dev server: `npm run dev` → open http://localhost:3000

---

## The 3 Demo Syllabi

Place real PDF syllabi in `./demo-syllabi/` before running the cache script.

| Filename | Course | Cache File |
|---|---|---|
| `cs101.pdf` | Introduction to Computer Science | `cache/cs101.json` |
| `math201.pdf` | Calculus II | `cache/math201.json` |
| `eng301.pdf` | Technical Writing | `cache/eng301.json` |

Run `node scripts/cache_demo_syllabi.mjs` to pre-process all 3 through Granite and save results to `./cache/`. Verify each JSON file has a `courseName` and a non-empty `tasks` array.

---

## If Granite Is Slow During Recording

The translate route has a disk cache. Once a syllabus is processed, subsequent requests return instantly.

**Force cache for a known syllabusId:**
```
POST /api/syllabus/translate?useCache=true
```

**Bypass upload entirely using a named cache file:**
```
POST /api/syllabus/translate?syllabusName=cs101
```
This returns `cache/cs101.json` instantly with no Granite call — ideal for demo recordings.

---

## Demo Reset

Press **Ctrl+Shift+R** on any page to:
- Clear all `vantage_*` keys from localStorage
- Redirect to `/onboarding`

Use this between demo runs to start fresh.

---

## All Start Commands

```bash
# Install
npm install

# Cache demo syllabi (run once after placing PDFs in ./demo-syllabi/)
node scripts/cache_demo_syllabi.mjs

# Development
npm run dev

# Production build (verify 0 errors before deploy)
npm run build

# Start production server
npm start
```
