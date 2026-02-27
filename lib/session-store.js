/**
 * lib/session-store.js
 * In-memory store for uploaded syllabi, shared across all API routes.
 *
 * Uses globalThis so the Map survives Next.js hot-module-replacement in dev,
 * where individual modules can be re-evaluated while the Node.js process lives on.
 *
 * Keys:   syllabusId (UUID string)
 * Values: { rawText, filename, buffer, uploadedAt }
 *
 * ── localStorage Key Shapes ───────────────────────────────────────────────────
 * These keys are written by the client-side upload and onboarding flows.
 * All are JSON-stringified. The dashboard and syllabus view read all four.
 *
 * 'vantage_cap'
 *   Written by: onboarding/page.jsx after a successful POST /api/cap
 *   Shape: {
 *     displayName        : string             — e.g. "Alex"
 *     informationDensity : 'summary' | 'moderate' | 'full'
 *     timeHorizon        : '24h' | '72h' | '1week' | '2weeks'
 *     sensoryFlags       : Array<string>      — subset of ['loud','bright','crowds','open']
 *     supportLevel       : 'reminder' | 'step-by-step' | 'full-agent'
 *     sessionId          : string             — UUID returned by /api/cap
 *   }
 *
 * 'vantage_tasks'
 *   Written by: upload/page.jsx after a successful POST /api/syllabus/translate
 *   Overwritten on every new syllabus upload (holds the most recent syllabus only).
 *   Shape: Array<{
 *     id                      : string        — "t1", "t2", ...
 *     title                   : string
 *     plainEnglishDescription : string
 *     dueDate                 : string | null — "YYYY-MM-DD" or null
 *     priority                : 'high' | 'medium' | 'low'
 *     estimatedMinutes        : number
 *     confidence              : 'high' | 'medium' | 'low'
 *     steps                   : Array<string> | null
 *     type                    : string        — 'assignment'|'exam'|'lab'|'project'|...
 *   }>
 *   Read by: dashboard/page.jsx (filtered by CAP timeHorizon), syllabus/[id]/page.jsx
 *
 * 'vantage_syllabi'
 *   Written by: upload/page.jsx — pushes to the existing array on each upload.
 *   Accumulates across sessions (does not reset on new upload).
 *   Shape: Array<{
 *     id         : string   — syllabusId UUID (used as URL param in /syllabus/[id])
 *     courseName : string
 *     instructor : string
 *     term       : string
 *     uploadedAt : string   — ISO 8601 timestamp
 *   }>
 *   Read by: dashboard/page.jsx (My Syllabi list), syllabus/[id]/page.jsx
 *
 * 'vantage_completed'
 *   Written by: syllabus/[id]/page.jsx and dashboard/page.jsx when a TaskCard is toggled.
 *   Shape: Array<string>    — task ID strings, e.g. ["t1", "t3"]
 *   Read by: both pages above to render completed state on TaskCards
 *
 * ── timeHorizon Filtering Contract ───────────────────────────────────────────
 * The dashboard filters vantage_tasks by the student's capProfile.timeHorizon.
 * This is the direct demo of Pillar 1 (CAP) controlling Pillar 2 (task list).
 *
 * Mapping:
 *   '24h'    → show tasks due within the next 24 hours
 *   '72h'    → show tasks due within the next 72 hours  (3 days)
 *   '1week'  → show tasks due within the next 168 hours (7 days)
 *   '2weeks' → show tasks due within the next 336 hours (14 days)
 *
 * Always-show rules (not filtered by horizon):
 *   • Tasks where dueDate is null       — no deadline, always visible
 *   • Tasks where dueDate is in the past — overdue, always visible
 *     (Past dates satisfy `dueDate <= cutoff` because cutoff > now > past date)
 *
 * Reference implementation (stable, confirmed in dashboard/page.jsx):
 *   const hours  = { '24h': 24, '72h': 72, '1week': 168, '2weeks': 336 }[horizon] ?? 72
 *   const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000)
 *   tasks.filter(t => !t.dueDate || new Date(t.dueDate + 'T00:00:00') <= cutoff)
 */

if (!globalThis.__syllabusStore) {
  globalThis.__syllabusStore = new Map()
}

export const syllabusStore = globalThis.__syllabusStore
