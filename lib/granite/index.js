/**
 * lib/granite/index.js
 * Main export for the Granite AI library.
 * Re-exports CAP utilities so consumers only need to import from @/lib/granite.
 */

import { extractSyllabusData } from './parser.js'
import { translateAssignments } from './cap.js'

// Re-export CAP utilities for convenience
export { buildCAP } from '../cap/engine.js'
export { CAP_QUESTIONS } from '../cap/questions.js'

/**
 * translateSyllabus(rawText, capProfile)
 *
 * The two-pass pipeline:
 *   Pass 1 — Extract structured data from raw syllabus text (parser.js)
 *   Pass 2 — Rewrite descriptions in plain English per the student's CAP (cap.js)
 *
 * @param {string} rawText - raw text extracted from the PDF
 * @param {{ displayName, informationDensity, timeHorizon, sensoryFlags, supportLevel }} capProfile
 * @returns {Promise<{
 *   courseName, instructor, term,
 *   tasks: Array,
 *   policies: object,
 *   importantDates: Array,
 *   processedAt: string
 * }>}
 */
export async function translateSyllabus(rawText, capProfile) {
  try {
    // Pass 1: extract
    const extracted = await extractSyllabusData(rawText)

    // Pass 2: translate
    const tasks = await translateAssignments(extracted.assignments, capProfile)

    return {
      courseName: extracted.courseName,
      instructor: extracted.instructor,
      term: extracted.term,
      tasks,
      policies: extracted.policies,
      importantDates: extracted.importantDates,
      processedAt: new Date().toISOString()
    }
  } catch (err) {
    throw new Error(`AI_PIPELINE_ERROR: ${err.message}`)
  }
}
