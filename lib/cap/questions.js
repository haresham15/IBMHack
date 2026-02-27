/**
 * CAP_QUESTIONS — the 5 Cognitive Accessibility Profile question definitions.
 * Imported by both /api/cap/route.js (for processing) and the onboarding page (for rendering).
 *
 * Each question:
 *   id       — q1–q5
 *   field    — which CAP key this answer sets
 *   question — human-readable prompt shown to the student
 *   type     — "single" | "multi" | "text"
 *   options  — display labels (parallel array with values)
 *   values   — CAP values mapped by index to options (omitted for text type)
 */

export const CAP_QUESTIONS = [
  {
    id: 'q1',
    field: 'informationDensity',
    question: 'How much detail do you want for each task?',
    type: 'single',
    options: [
      'Just the essentials — one or two sentences',
      'A bit of context — two or three sentences',
      'Full breakdown — step-by-step instructions'
    ],
    values: ['summary', 'moderate', 'full']
  },
  {
    id: 'q2',
    field: 'timeHorizon',
    question: 'How far ahead do you want deadline reminders?',
    type: 'single',
    options: [
      'Same day (24 hours before)',
      '3 days ahead',
      '1 week ahead',
      '2 weeks ahead'
    ],
    values: ['24h', '72h', '1week', '2weeks']
  },
  {
    id: 'q3',
    field: 'sensoryFlags',
    question: 'What environments make it hard for you to focus? (Select all that apply)',
    type: 'multi',
    options: [
      'Loud or noisy spaces',
      'Bright lighting',
      'Crowded areas',
      'Open or exposed spaces'
    ],
    values: ['loud', 'bright', 'crowds', 'open']
  },
  {
    id: 'q4',
    field: 'supportLevel',
    question: 'How much help do you want with tasks?',
    type: 'single',
    options: [
      'Just remind me of the due date',
      'Break each task into numbered steps',
      'Full support — steps plus a suggested start date'
    ],
    values: ['reminder', 'step-by-step', 'full-agent']
  },
  {
    id: 'q5',
    field: 'displayName',
    question: 'What should Vantage call you?',
    type: 'text',
    options: [],
    values: []
  }
]
