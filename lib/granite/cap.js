/**
 * lib/granite/cap.js
 * Pass 2 — translates extracted assignments into plain English using the student's CAP.
 */

import { callGranite, safeParseJSON } from './client.js'
import { TRANSLATION_PROMPT } from './prompts.js'

/**
 * mergeTranslations(originals, translations)
 * Merges Pass 2 translation fields onto the original Pass 1 assignments.
 * Falls back to the original description if Granite returns nothing.
 */
function mergeTranslations(originals, translations) {
  const translationMap = Object.fromEntries(
    (translations ?? []).map(t => [t.id, t])
  )

  return originals.map(orig => {
    const t = translationMap[orig.id] ?? {}
    return {
      ...orig,
      plainEnglishDescription: t.plainEnglishDescription || orig.description,
      steps: Array.isArray(t.steps) && t.steps.length > 0 ? t.steps : null,
      suggestedStartDate: t.suggestedStartDate ?? null
    }
  })
}

/**
 * translateAssignments(assignments, capProfile)
 * Calls Granite Pass 2 to rewrite every assignment description according to the CAP.
 * Adds plainEnglishDescription, steps (or null), and suggestedStartDate (or null).
 *
 * @param {Array} assignments - output from extractSyllabusData
 * @param {{ informationDensity, supportLevel, timeHorizon, displayName }} capProfile
 * @returns {Promise<Array>} assignments with translation fields merged in
 */
export async function translateAssignments(assignments, capProfile) {
  if (!assignments || assignments.length === 0) return []

  const prompt = TRANSLATION_PROMPT(assignments, capProfile)
  const raw = await callGranite(prompt, { maxTokens: 2048, temperature: 0.2 })
  const parsed = await safeParseJSON(raw)

  const translations = parsed.assignments ?? []
  return mergeTranslations(assignments, translations)
}
