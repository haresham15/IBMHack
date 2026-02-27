/**
 * lib/granite/parser.js
 * Pass 1 — extracts structured assignment data from raw syllabus text.
 */

import { callGranite, safeParseJSON } from './client.js'
import { EXTRACTION_PROMPT } from './prompts.js'

/**
 * scoreConfidence(assignment)
 * Assigns a confidence level based on the completeness of the extracted data.
 *
 * "high"   — valid dueDate + title > 8 chars + description > 25 chars
 * "medium" — some fields present but incomplete
 * "low"    — dueDate is null, or title/description is too sparse
 */
function scoreConfidence(assignment) {
  const hasDate = !!assignment.dueDate
  const hasTitle = typeof assignment.title === 'string' && assignment.title.trim().length > 8
  const hasDesc = typeof assignment.description === 'string' && assignment.description.trim().length > 25

  if (hasDate && hasTitle && hasDesc) return 'high'
  if (hasTitle && hasDesc) return 'medium'
  return 'low'
}

/**
 * normaliseAssignment(raw, index)
 * Ensures every assignment has required fields, filling defaults where needed.
 */
function normaliseAssignment(raw, index) {
  return {
    id: raw.id ?? `t${index + 1}`,
    title: raw.title ?? 'Untitled Assignment',
    description: raw.description ?? '',
    dueDate: raw.dueDate ?? null,
    estimatedHours: typeof raw.estimatedHours === 'number' ? raw.estimatedHours : 2,
    type: raw.type ?? 'assignment',
    priority: raw.priority ?? 'medium',
    rubricPoints: raw.rubricPoints ?? null,
    confidence: scoreConfidence(raw)
  }
}

/**
 * extractSyllabusData(rawText)
 * Calls Granite Pass 1 to extract structured data from raw syllabus text.
 *
 * @param {string} rawText
 * @returns {Promise<{
 *   courseName: string,
 *   instructor: string,
 *   term: string,
 *   assignments: Array,
 *   policies: object,
 *   importantDates: Array
 * }>}
 */
export async function extractSyllabusData(rawText) {
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('rawText is too short to be a valid syllabus')
  }

  const prompt = EXTRACTION_PROMPT(rawText)
  const raw = await callGranite(prompt, { maxTokens: 2048, temperature: 0.1 })
  const parsed = await safeParseJSON(raw)

  const assignments = Array.isArray(parsed.assignments)
    ? parsed.assignments.map(normaliseAssignment)
    : []

  return {
    courseName: parsed.courseName ?? 'Unknown Course',
    instructor: parsed.instructor ?? 'Unknown Instructor',
    term: parsed.term ?? 'Unknown Term',
    assignments,
    policies: parsed.policies ?? {},
    importantDates: parsed.importantDates ?? []
  }
}
