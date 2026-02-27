/**
 * scripts/cache_demo_syllabi.mjs
 * Pre-populates ./cache/ with translated results for all PDFs in ./demo-syllabi/.
 *
 * Prerequisites:
 *   1. Run: node scripts/make_demo_pdfs.mjs   (or place real PDFs in demo-syllabi/)
 *   2. Start: npm run dev                      (dev server must be running on localhost:3000)
 *   3. Run: node scripts/cache_demo_syllabi.mjs
 *
 * Each PDF is uploaded, translated, and the result written to:
 *   ./cache/{filename-without-ext}.json
 *
 * These named cache files are served instantly by the translate route
 * when ?syllabusName=<name> is used — no session needed, works after restarts.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve, basename, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')

// Load .env.local
const envText = readFileSync(resolve(root, '.env.local'), 'utf8')
const env = envText.split('\n').reduce((acc, line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return acc
  const eq = trimmed.indexOf('=')
  if (eq !== -1) acc[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  return acc
}, {})
for (const [k, v] of Object.entries(env)) process.env[k] = v

const BASE = 'http://localhost:3000'
const DEMO_DIR = resolve(root, 'demo-syllabi')
const CACHE_DIR = resolve(root, 'cache')

// Standard demo CAP profile used for all pre-cached syllabi
const DEMO_CAP = {
  displayName: 'Demo Student',
  informationDensity: 'moderate',
  timeHorizon: '72h',
  sensoryFlags: [],
  supportLevel: 'step-by-step'
}

mkdirSync(CACHE_DIR, { recursive: true })

const files = readdirSync(DEMO_DIR).filter(f => f.toLowerCase().endsWith('.pdf'))
if (files.length === 0) {
  console.error('No PDFs found in demo-syllabi/.')
  console.error('Run: node scripts/make_demo_pdfs.mjs')
  process.exit(1)
}

console.log(`\nCaching ${files.length} demo syllabus/syllabi from demo-syllabi/\n`)
console.log(`Server: ${BASE}`)
console.log(`CAP:    ${DEMO_CAP.informationDensity} density, ${DEMO_CAP.supportLevel} support\n`)

// Verify server is reachable before starting
try {
  const ping = await fetch(`${BASE}/api/cap`, { method: 'GET', signal: AbortSignal.timeout(3000) }).catch(() => null)
  if (!ping) throw new Error('no response')
} catch {
  console.error(`Cannot reach ${BASE}. Is the dev server running?`)
  console.error('Start it with: npm run dev')
  process.exit(1)
}

let processed = 0

for (const file of files) {
  const name = basename(file, extname(file))
  const pdfPath = resolve(DEMO_DIR, file)
  const outPath = resolve(CACHE_DIR, `${name}.json`)

  console.log(`── ${file}`)

  // ── Step 1: Upload ──────────────────────────────────────────────────────
  const pdfBuffer = readFileSync(pdfPath)
  const formData = new FormData()
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), file)

  let syllabusId
  try {
    const res = await fetch(`${BASE}/api/syllabus/upload`, { method: 'POST', body: formData })
    const data = await res.json()
    if (!data.syllabusId) throw new Error(data.message ?? JSON.stringify(data))
    syllabusId = data.syllabusId
    console.log(`   upload  ✓  ${data.wordCount} words  (id: ${syllabusId.slice(0, 8)}...)`)
  } catch (err) {
    console.error(`   upload  ✗  ${err.message}`)
    continue
  }

  // ── Step 2: Translate (real Granite call — takes 30-60s) ────────────────
  console.log(`   granite ⟳  running two-pass pipeline...`)
  const t0 = Date.now()

  let result
  try {
    const res = await fetch(`${BASE}/api/syllabus/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabusId, capProfile: DEMO_CAP }),
      signal: AbortSignal.timeout(120_000)
    })
    result = await res.json()
    if (result.error) throw new Error(result.message)
  } catch (err) {
    console.error(`   granite ✗  ${err.message}`)
    continue
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

  // ── Step 3: Write named cache file ──────────────────────────────────────
  // The translate route already wrote cache/{syllabusId}.json.
  // We also write cache/{name}.json so ?syllabusName=<name> can serve it
  // without a live session (works after server restarts).
  writeFileSync(outPath, JSON.stringify(result, null, 2))

  console.log(`   done    ✓  ${result.courseName}`)
  console.log(`           ✓  ${result.tasks.length} tasks extracted  (${elapsed}s)`)
  console.log(`           ✓  cache/${name}.json written\n`)

  processed++
}

console.log('─'.repeat(50))
if (processed === files.length) {
  console.log(`SUCCESS — ${processed}/${files.length} syllabi cached\n`)
  console.log('Usage in the app:')
  for (const file of files) {
    const name = basename(file, extname(file))
    console.log(`  POST /api/syllabus/translate?syllabusName=${name}`)
  }
  console.log()
} else {
  console.error(`PARTIAL — ${processed}/${files.length} syllabi cached`)
  process.exit(1)
}
