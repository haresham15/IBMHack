/**
 * scripts/gate_check_p3a.mjs
 * Gate checks for P3A Upload & Translation API routes.
 * Run: node scripts/gate_check_p3a.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')

// Load .env.local
const env = readFileSync(resolve(root, '.env.local'), 'utf8').split('\n').reduce((acc, line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return acc
  const eq = trimmed.indexOf('=')
  if (eq !== -1) acc[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  return acc
}, {})
for (const [k, v] of Object.entries(env)) process.env[k] = v

const BASE = 'http://localhost:3000'

let passed = 0, failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}${detail ? ` (${detail})` : ''}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ── Minimal valid PDF factory ────────────────────────────────────────────────

function makePDF(bodyText) {
  // Escape PDF string special chars
  const escaped = bodyText.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

  // Split into 80-char lines for the PDF stream
  const words = escaped.split(' ')
  const lines = []
  let current = ''
  for (const w of words) {
    if ((current + ' ' + w).length > 70) { lines.push(current); current = w }
    else { current = current ? current + ' ' + w : w }
  }
  if (current) lines.push(current)

  const streamLines = lines.map((l, i) => `BT /F1 10 Tf 40 ${750 - i * 14} Td (${l}) Tj ET`).join('\n')
  const streamLen = Buffer.byteLength(streamLines, 'utf8')

  const objects = [
    '1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n',
    '2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n',
    '3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n',
    `4 0 obj\n<</Length ${streamLen}>>\nstream\n${streamLines}\nendstream\nendobj\n`,
    '5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\n'
  ]

  const header = '%PDF-1.4\n'
  let pos = header.length
  const offsets = []
  for (const obj of objects) {
    offsets.push(pos)
    pos += Buffer.byteLength(obj, 'utf8')
  }
  const xrefPos = pos

  const xref = [
    'xref\n0 6\n',
    '0000000000 65535 f \n',
    ...offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`)
  ].join('')

  const trailer = `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`
  return Buffer.from(header + objects.join('') + xref + trailer, 'utf8')
}

// ── Test PDF content ──────────────────────────────────────────────────────────

const SYLLABUS_TEXT = [
  'CS 4890 Advanced Software Engineering Spring 2025 Instructor Professor Alice Zhou',
  'Assignment 1 Build a REST API with authentication due February 15 2025 worth 20 points',
  'Assignment 2 Implement a database layer with PostgreSQL due March 8 2025 worth 20 points',
  'Midterm Exam in class exam covering weeks 1 through 7 bring student ID due March 22 2025 worth 30 points',
  'Final Project build and deploy a full stack web application due April 28 2025 worth 30 points',
  'Lab exercise thread safety and concurrency due date to be announced check portal',
  'Attendance policy maximum 3 absences before grade penalty',
  'Late work policy 10 percent deducted per day maximum 5 days',
  'Academic integrity all work must be original plagiarism results in an F grade'
].join(' ')

const testPDF = makePDF(SYLLABUS_TEXT)
mkdirSync(resolve(root, 'cache'), { recursive: true })
writeFileSync(resolve(root, 'cache', 'test-syllabus.pdf'), testPDF)

// ── Gate 1: Upload a valid PDF ────────────────────────────────────────────────

console.log('\nGate checks for P3A — Upload & Translation API\n')
console.log('── Gate 1: POST /api/syllabus/upload (valid PDF)')

const uploadForm = new FormData()
uploadForm.append('file', new Blob([testPDF], { type: 'application/pdf' }), 'test-syllabus.pdf')

const uploadRes = await fetch(`${BASE}/api/syllabus/upload`, { method: 'POST', body: uploadForm })
const uploadData = await uploadRes.json()

check('status 200', uploadRes.status === 200, `got ${uploadRes.status}`)
check('syllabusId returned', typeof uploadData.syllabusId === 'string' && uploadData.syllabusId.length > 0, uploadData.syllabusId)
check('wordCount returned', typeof uploadData.wordCount === 'number' && uploadData.wordCount > 0, `${uploadData.wordCount} words`)
check('status: uploaded', uploadData.status === 'uploaded')

const syllabusId = uploadData.syllabusId

// ── Gate 2: Upload a non-PDF ──────────────────────────────────────────────────

console.log('\n── Gate 2: POST /api/syllabus/upload (non-PDF → 400)')

const badForm = new FormData()
badForm.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'notapdf.txt')

const badRes = await fetch(`${BASE}/api/syllabus/upload`, { method: 'POST', body: badForm })
const badData = await badRes.json()

check('status 400', badRes.status === 400, `got ${badRes.status}`)
check('error: true', badData.error === true)
check('code: VALIDATION_ERROR', badData.code === 'VALIDATION_ERROR', badData.code)

// ── Gate 3: Upload with no file ───────────────────────────────────────────────

console.log('\n── Gate 3: POST /api/syllabus/upload (no file → 400)')

const emptyForm = new FormData()
const emptyRes = await fetch(`${BASE}/api/syllabus/upload`, { method: 'POST', body: emptyForm })
const emptyData = await emptyRes.json()

check('status 400', emptyRes.status === 400, `got ${emptyRes.status}`)
check('error: true', emptyData.error === true)

// ── Gate 4: GET original PDF ──────────────────────────────────────────────────

console.log('\n── Gate 4: GET /api/syllabus/:id/original (serves PDF)')

const origRes = await fetch(`${BASE}/api/syllabus/${syllabusId}/original`)
check('status 200', origRes.status === 200, `got ${origRes.status}`)
check('Content-Type: application/pdf', origRes.headers.get('content-type')?.includes('application/pdf'),
  origRes.headers.get('content-type'))

// ── Gate 5: GET original PDF for unknown ID → 404 ────────────────────────────

console.log('\n── Gate 5: GET /api/syllabus/nonexistent/original (→ 404)')

const noOrigRes = await fetch(`${BASE}/api/syllabus/nonexistent-id-12345/original`)
const noOrigData = await noOrigRes.json()
check('status 404', noOrigRes.status === 404, `got ${noOrigRes.status}`)
check('code: NOT_FOUND', noOrigData.code === 'NOT_FOUND', noOrigData.code)

// ── Gate 6: Translate with unknown syllabusId → 404 ──────────────────────────

console.log('\n── Gate 6: POST /api/syllabus/translate (unknown ID → 404)')

const notFoundRes = await fetch(`${BASE}/api/syllabus/translate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ syllabusId: 'unknown-id-999', capProfile: { informationDensity: 'moderate', supportLevel: 'step-by-step' } })
})
const notFoundData = await notFoundRes.json()
check('status 404', notFoundRes.status === 404, `got ${notFoundRes.status}`)
check('code: NOT_FOUND', notFoundData.code === 'NOT_FOUND', notFoundData.code)

// ── Gate 7: Translate with missing fields → 400 ───────────────────────────────

console.log('\n── Gate 7: POST /api/syllabus/translate (missing capProfile → 400)')

const missingCapRes = await fetch(`${BASE}/api/syllabus/translate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ syllabusId })
})
const missingCapData = await missingCapRes.json()
check('status 400', missingCapRes.status === 400, `got ${missingCapRes.status}`)
check('code: VALIDATION_ERROR', missingCapData.code === 'VALIDATION_ERROR', missingCapData.code)

// ── Gate 8: Full translate (real Granite call) ────────────────────────────────

console.log('\n── Gate 8: POST /api/syllabus/translate (real Granite pipeline)')
console.log('  (This calls IBM Granite — may take 30-60s...)')

const TEST_CAP = {
  displayName: 'Alex',
  informationDensity: 'moderate',
  timeHorizon: '72h',
  sensoryFlags: ['loud'],
  supportLevel: 'step-by-step'
}

const translateRes = await fetch(`${BASE}/api/syllabus/translate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ syllabusId, capProfile: TEST_CAP })
})
const translateData = await translateRes.json()

check('status 200', translateRes.status === 200, `got ${translateRes.status}`)
check('X-Cache: MISS', translateRes.headers.get('x-cache') === 'MISS', translateRes.headers.get('x-cache'))
check('has tasks array', Array.isArray(translateData.tasks) && translateData.tasks.length > 0,
  `${translateData.tasks?.length} tasks`)

const firstTask = translateData.tasks?.[0]
check('first task has plainEnglishDescription',
  typeof firstTask?.plainEnglishDescription === 'string' && firstTask.plainEnglishDescription.length > 10,
  `"${firstTask?.plainEnglishDescription?.slice(0, 60)}..."`)
check('first task has confidence field',
  ['high', 'medium', 'low'].includes(firstTask?.confidence),
  firstTask?.confidence)
check('first task has estimatedMinutes',
  typeof firstTask?.estimatedMinutes === 'number',
  `${firstTask?.estimatedMinutes}min`)
check('at least one task has steps array (step-by-step CAP)',
  translateData.tasks?.some(t => Array.isArray(t.steps) && t.steps.length >= 3))
check('at least one task has confidence: low',
  translateData.tasks?.some(t => t.confidence === 'low'),
  translateData.tasks?.find(t => t.confidence === 'low')?.title ?? 'none found')

// ── Gate 9: Cache HIT ─────────────────────────────────────────────────────────

console.log('\n── Gate 9: POST /api/syllabus/translate?useCache=true (→ cache HIT)')

const cacheRes = await fetch(`${BASE}/api/syllabus/translate?useCache=true`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ syllabusId, capProfile: TEST_CAP })
})
check('status 200', cacheRes.status === 200, `got ${cacheRes.status}`)
check('X-Cache: HIT', cacheRes.headers.get('x-cache') === 'HIT', cacheRes.headers.get('x-cache'))

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50))
if (failed === 0) {
  console.log(`SUCCESS — all ${passed} gate checks passed`)
} else {
  if (translateData.error) {
    console.log('\nGranite error detail:', translateData.message)
  }
  console.error(`\nFAILED — ${failed} of ${passed + failed} checks failed`)
  process.exit(1)
}
