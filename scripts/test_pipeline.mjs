/**
 * scripts/test_pipeline.mjs
 * Integration test for the Granite two-pass pipeline.
 * Run: node scripts/test_pipeline.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local manually ────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const envPath = resolve(root, '.env.local')

const env = readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return acc
  const eq = trimmed.indexOf('=')
  if (eq === -1) return acc
  acc[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  return acc
}, {})

// Inject into process.env so lib modules pick them up
for (const [k, v] of Object.entries(env)) process.env[k] = v

// ── Import after env is set ─────────────────────────────────────────────────
const { translateSyllabus } = await import('../lib/granite/index.js')

// ── Test fixtures ───────────────────────────────────────────────────────────

const TEST_SYLLABUS = `
CS 4210 — Operating Systems
Instructor: Prof. Marcus Webb
Term: Fall 2025

Course Description:
This course covers the fundamental concepts of operating systems including
process management, memory management, file systems, and concurrency.

Assignments and Deadlines:

Programming Assignment 1 — Shell Implementation
Build a basic Unix shell that supports piping and redirection.
Worth 15% of final grade (150 points).
Due: September 19, 2025

Midterm Exam
In-class written exam covering Chapters 1-8. Bring student ID.
Worth 25% of final grade.
Due: October 10, 2025

Programming Assignment 2 — Memory Allocator
Implement malloc() and free() from scratch using a free-list algorithm.
Worth 20% of final grade (200 points).
Due: November 7, 2025

Lab 3 — Thread Synchronization
Implement producer-consumer problem using semaphores.
Worth 10% of final grade.
Due date to be announced — check course portal.

Policies:
Attendance: Students may miss up to 3 classes without penalty.
Late work: 10 points deducted per day late. No submissions accepted after 5 days.
Academic integrity: All code must be your own. Plagiarism results in an F.
`

const TEST_CAP = {
  displayName: 'Jordan',
  informationDensity: 'moderate',
  timeHorizon: '72h',
  sensoryFlags: ['loud'],
  supportLevel: 'step-by-step'
}

// ── Run ─────────────────────────────────────────────────────────────────────

console.log('Running Granite two-pass pipeline test...\n')
console.log(`  Student: ${TEST_CAP.displayName}`)
console.log(`  Density: ${TEST_CAP.informationDensity}`)
console.log(`  Support: ${TEST_CAP.supportLevel}`)
console.log('')

let result
try {
  result = await translateSyllabus(TEST_SYLLABUS, TEST_CAP)
} catch (err) {
  console.error('FAILED — pipeline threw error:')
  console.error(err.message)
  process.exit(1)
}

// ── Gate checks ─────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

console.log('Gate checks:')

check('result has tasks array', Array.isArray(result.tasks) && result.tasks.length > 0,
  `tasks: ${result.tasks?.length}`)

const firstTask = result.tasks?.[0]
check('first task has plainEnglishDescription from Granite',
  typeof firstTask?.plainEnglishDescription === 'string' &&
  firstTask.plainEnglishDescription.length > 20,
  `desc: "${firstTask?.plainEnglishDescription?.slice(0, 80)}..."`)

check('first task has steps array (step-by-step support level)',
  Array.isArray(firstTask?.steps) && firstTask.steps.length >= 3,
  `steps count: ${firstTask?.steps?.length}`)

check('steps have 3-5 items on first task',
  Array.isArray(firstTask?.steps) &&
  firstTask.steps.length >= 3 && firstTask.steps.length <= 5,
  `count: ${firstTask?.steps?.length}`)

const lowConfTask = result.tasks?.find(t => t.confidence === 'low')
check('at least one task has confidence: low (ambiguous due date)',
  !!lowConfTask,
  lowConfTask ? `"${lowConfTask.title}"` : 'none found')

check('result has courseName', typeof result.courseName === 'string' && result.courseName.length > 0,
  result.courseName)

check('result has processedAt timestamp', !!result.processedAt)

// ── Save output ──────────────────────────────────────────────────────────────

const cachePath = resolve(root, 'cache')
mkdirSync(cachePath, { recursive: true })
const outputFile = resolve(cachePath, 'test_output.json')
writeFileSync(outputFile, JSON.stringify(result, null, 2))
check('cache/test_output.json saved', true, outputFile)

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('')
console.log('─'.repeat(50))
if (failed === 0) {
  console.log(`SUCCESS — all ${passed} gate checks passed`)
  console.log('')
  console.log('Sample output:')
  console.log(`  Course: ${result.courseName}`)
  console.log(`  Tasks: ${result.tasks.length}`)
  console.log('')
  for (const task of result.tasks) {
    console.log(`  [${task.confidence.toUpperCase()}] ${task.title}`)
    console.log(`    → ${task.plainEnglishDescription?.slice(0, 100)}`)
    if (task.steps) {
      console.log(`    Steps (${task.steps.length}): ${task.steps[0]}`)
    }
    console.log('')
  }
} else {
  console.error(`FAILED — ${failed} of ${passed + failed} checks failed`)
  console.log('\nFull result:')
  console.log(JSON.stringify(result, null, 2))
  process.exit(1)
}
