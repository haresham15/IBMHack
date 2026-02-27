/**
 * app/api/agent/route.js
 * Proactive Agent Alert — Pillar 3 of the Vantage architecture.
 *
 * ── PRODUCTION ARCHITECTURE: WatsonX Orchestrate ─────────────────────────────
 *
 * In production this endpoint is driven by an IBM WatsonX Orchestrate agent
 * that continuously monitors three signal streams for each student:
 *
 *   1. Task engagement signals
 *      Orchestrate tracks whether the student has opened, expanded, or marked
 *      tasks within their CAP time horizon window. Inactivity crossing a
 *      threshold — for example, 72 consecutive hours of no task list interaction
 *      for a student whose timeHorizon is '72h' — is treated as a risk signal.
 *      The threshold is proportional to the student's declared timeHorizon so
 *      a '24h' student is alerted much sooner than a '2weeks' student.
 *
 *   2. Deadline proximity relative to CAP timeHorizon
 *      Every task extracted from the syllabus has a dueDate. Orchestrate computes
 *      the delta between dueDate and now, weighted by the student's timeHorizon
 *      and the task's priority field. A high-priority task (exam, final project)
 *      that is within the student's horizon and has not been acknowledged triggers
 *      an alert regardless of engagement history. This is what the dashboard's
 *      filterByHorizon() function previews — Orchestrate performs the same
 *      calculation server-side and surfaces it proactively rather than waiting
 *      for the student to open the app.
 *
 *   3. Document interaction history
 *      WatsonX Orchestrate receives interaction signals from the Syllabus View
 *      and Upload flows: was the original PDF ever opened? Were any task steps
 *      expanded or completed? Were any important-date items acknowledged?
 *      A critical document — such as a FAFSA verification form linked in the
 *      syllabus — that has not been viewed within the student's CAP horizon is
 *      an explicit, high-priority alert trigger.
 *
 * When two or more risk signals are active simultaneously, Orchestrate calls this
 * route's production handler with a structured payload. The handler selects the
 * highest-priority alert, formats it respecting the student's sensoryFlags and
 * supportLevel from their CAP profile, and returns a single actionable alert
 * object. The alert is deliberately minimal — one message, one action — to avoid
 * overwhelming students with sensory or cognitive load sensitivities.
 *
 * ── MVP DEMO ──────────────────────────────────────────────────────────────────
 *
 * For the hackathon demo this returns a deterministic FAFSA deadline alert.
 * The FAFSA scenario was chosen because it demonstrates the highest-stakes use
 * case: a financial aid form that is not in the syllabus task list but is a
 * time-sensitive institutional requirement. In the production system, Orchestrate
 * would detect this via integration with the student information system. In the
 * demo it is hardcoded to give judges a clear, realistic view of the Proactive
 * Agent UX without requiring a live Orchestrate integration.
 *
 * Response shape (stable contract with dashboard/page.jsx and agent/page.jsx):
 *   {
 *     alertType : string   — 'deadline' | 'inactivity' | 'document' | 'risk'
 *     urgent    : boolean  — true = red banner, false = yellow banner
 *     message   : string   — one plain-English sentence describing the risk
 *     cta       : string   — button label (≤ 5 words, imperative)
 *     action    : string   — machine-readable action key for the agent page
 *   }
 */

export async function GET() {
  return Response.json({
    alertType: 'deadline',
    urgent: true,
    message: 'Your FAFSA verification form is due in 3 days and has not been started.',
    cta: 'Walk me through it',
    action: 'start-form-walkthrough'
  })
}
