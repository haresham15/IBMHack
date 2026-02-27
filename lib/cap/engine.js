import { CAP_QUESTIONS } from './questions.js'

/**
 * buildCAP(answers)
 *
 * Turns the raw onboarding answers array into a structured CAP object.
 *
 * @param {Array<{ questionId: string, answer: string | string[] }>} answers
 * @returns {{ displayName, informationDensity, timeHorizon, sensoryFlags, supportLevel, createdAt }}
 */
export function buildCAP(answers) {
  const cap = {
    displayName: 'Student',
    informationDensity: 'moderate',
    timeHorizon: '72h',
    sensoryFlags: [],
    supportLevel: 'step-by-step',
    createdAt: new Date().toISOString()
  }

  // Build a lookup map from questionId → question definition
  const questionMap = Object.fromEntries(CAP_QUESTIONS.map(q => [q.id, q]))

  for (const { questionId, answer } of answers) {
    const question = questionMap[questionId]
    if (!question) continue // ignore unknown question IDs

    const { field, type, options, values } = question

    if (type === 'text') {
      // Store text answer directly; fall back to default if blank
      cap[field] = typeof answer === 'string' && answer.trim()
        ? answer.trim()
        : cap[field]

    } else if (type === 'multi') {
      // Multi-select: answer is an array of selected option labels or values
      // Accept both the display label and the underlying value
      const selected = Array.isArray(answer) ? answer : [answer]
      cap[field] = selected.map(item => {
        const byValue = values.includes(item) ? item : null
        const byLabel = options.indexOf(item) !== -1 ? values[options.indexOf(item)] : null
        return byValue ?? byLabel ?? item
      }).filter(Boolean)

    } else {
      // single: answer is the option label or the underlying value
      const byValue = values.includes(answer) ? answer : null
      const byLabel = options.indexOf(answer) !== -1 ? values[options.indexOf(answer)] : null
      const resolved = byValue ?? byLabel
      if (resolved !== null && resolved !== undefined) {
        cap[field] = resolved
      }
    }
  }

  // sensoryFlags must always be an array
  if (!Array.isArray(cap.sensoryFlags)) {
    cap.sensoryFlags = cap.sensoryFlags ? [cap.sensoryFlags] : []
  }

  return cap
}
