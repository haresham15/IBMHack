/**
 * lib/granite/prompts.js
 * All Granite prompt templates for the two-pass syllabus pipeline.
 */

// ─── Pass 1: Extraction ────────────────────────────────────────────────────

export const EXTRACTION_SYSTEM = `You are an academic syllabus parser. Your only job is to extract structured data from syllabus text and output it as valid JSON.

Rules:
- Output ONLY valid JSON. No preamble, no explanation, no markdown, no code fences.
- Your entire response must be directly parseable by JSON.parse().
- If a field is unknown or missing, use null.
- For dueDate, use ISO 8601 format (YYYY-MM-DD) or null if unclear or not mentioned.
- For estimatedHours, give a realistic estimate based on the task type if not stated.
- For priority: exams and final projects are "high", regular assignments "medium", readings "low".`

/**
 * EXTRACTION_PROMPT(rawText)
 * Pass 1 — extract all assignments and metadata from raw syllabus text.
 */
export function EXTRACTION_PROMPT(rawText) {
  return `<|system|>
${EXTRACTION_SYSTEM}
<|user|>
Parse this syllabus. Extract every assignment, exam, quiz, project, lab, and reading. Return this exact JSON structure with no other text:

{
  "courseName": "string",
  "instructor": "string",
  "term": "string",
  "assignments": [
    {
      "id": "t1",
      "title": "string (assignment name)",
      "description": "string (what the student must do, from the syllabus)",
      "dueDate": "YYYY-MM-DD or null",
      "estimatedHours": 2,
      "type": "assignment|exam|quiz|project|reading|lab|other",
      "priority": "high|medium|low",
      "rubricPoints": 100
    }
  ],
  "policies": {
    "attendance": "string or null",
    "lateWork": "string or null",
    "academicIntegrity": "string or null"
  },
  "importantDates": [
    { "date": "YYYY-MM-DD", "description": "string" }
  ]
}

Syllabus text:
${rawText}
<|assistant|>`
}

// ─── Pass 2: Translation ───────────────────────────────────────────────────

export const TRANSLATION_SYSTEM = `You are an accessibility specialist who rewrites academic task descriptions in plain English tailored to each student's cognitive preferences.

Rules:
- Output ONLY valid JSON. No preamble, no explanation, no markdown, no code fences.
- Your entire response must be directly parseable by JSON.parse().
- Never use academic jargon if plain words exist.
- Write for the student directly (use "you" and "your").
- Be warm, clear, and direct. Avoid passive voice.`

/**
 * TRANSLATION_PROMPT(assignments, capProfile)
 * Pass 2 — rewrite assignments into plain English according to the student's CAP.
 */
export function TRANSLATION_PROMPT(assignments, capProfile) {
  const { informationDensity, supportLevel, timeHorizon } = capProfile

  const densityRule =
    informationDensity === 'summary'
      ? 'Write 1-2 plain sentences only. Get straight to what needs to be done and when.'
      : informationDensity === 'full'
      ? 'Write a complete, thorough explanation. Include what to do, why it matters, and any important details from the description.'
      : 'Write 2-3 plain sentences. Include what to do, the key requirement, and any important detail.'

  const supportRule =
    supportLevel === 'reminder'
      ? 'Set steps to null. Just remind them of the due date in the description.'
      : supportLevel === 'full-agent'
      ? 'Include a steps array with 3-5 numbered concrete micro-actions (each under 15 words). Also include a suggestedStartDate in YYYY-MM-DD format — calculate it as the dueDate minus estimatedHours divided by 2 days of work.'
      : 'Include a steps array with 3-5 numbered concrete micro-actions (each under 15 words). Set suggestedStartDate to null.'

  return `<|system|>
${TRANSLATION_SYSTEM}
<|user|>
Rewrite these assignments for a student with these preferences:
- Information density: ${informationDensity} — ${densityRule}
- Support level: ${supportLevel} — ${supportRule}
- Deadline horizon: ${timeHorizon} (for context only, do not include in output)

Return this exact JSON structure with no other text:

{
  "assignments": [
    {
      "id": "t1",
      "plainEnglishDescription": "string",
      "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."] or null,
      "suggestedStartDate": "YYYY-MM-DD or null"
    }
  ]
}

Assignments to rewrite:
${JSON.stringify(assignments, null, 2)}
<|assistant|>`
}
