import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { syllabusStore } from '@/lib/session-store'
import { translateSyllabus } from '@/lib/granite/index'

const CACHE_DIR = join(process.cwd(), 'cache')

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Keyed by IP, stores { count, windowStart } per IP.
// 10 requests per IP per 60-second window.
const rateLimitMap = new Map()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false // not limited
  }
  entry.count++
  return entry.count > RATE_LIMIT // limited if over threshold
}

export async function POST(request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  if (checkRateLimit(ip)) {
    return Response.json(
      { error: true, code: 'RATE_LIMITED', message: 'Too many requests. Please wait 60 seconds.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const useCache = searchParams.get('useCache') === 'true'
  const syllabusName = searchParams.get('syllabusName')

  // ── Named demo shortcut ──────────────────────────────────────────────────
  // ?syllabusName=<name> bypasses body parsing entirely.
  // Returns pre-cached data instantly — no session or Granite call needed.
  if (syllabusName) {
    const safeName = syllabusName.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!safeName) {
      return Response.json(
        { error: true, code: 'VALIDATION_ERROR', message: 'Invalid syllabusName.' },
        { status: 400 }
      )
    }
    const nameCachePath = join(CACHE_DIR, `${safeName}.json`)
    if (existsSync(nameCachePath)) {
      try {
        const cached = JSON.parse(readFileSync(nameCachePath, 'utf8'))
        return Response.json(cached, { headers: { 'X-Cache': 'HIT' } })
      } catch {
        // Cache file corrupted — fall through to 404
      }
    }
    return Response.json(
      {
        error: true,
        code: 'NOT_FOUND',
        message: `Demo cache '${safeName}' not found. Run: node scripts/cache_demo_syllabi.mjs`
      },
      { status: 404 }
    )
  }

  // ── Standard flow ────────────────────────────────────────────────────────

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  const { syllabusId, capProfile } = body ?? {}

  if (!syllabusId || !capProfile) {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'Both syllabusId and capProfile are required.' },
      { status: 400 }
    )
  }

  // ?useCache=true — check disk cache BEFORE session lookup.
  if (useCache) {
    const cachePath = join(CACHE_DIR, `${syllabusId}.json`)
    if (existsSync(cachePath)) {
      try {
        const cached = JSON.parse(readFileSync(cachePath, 'utf8'))
        return Response.json(cached, { headers: { 'X-Cache': 'HIT' } })
      } catch {
        // Cache read failed — fall through to recompute
      }
    }
  }

  // Look up session
  const session = syllabusStore.get(syllabusId)
  if (!session) {
    return Response.json(
      {
        error: true,
        code: 'NOT_FOUND',
        message: `Syllabus ${syllabusId} not found. It may have expired — please upload the PDF again.`
      },
      { status: 404 }
    )
  }

  // Run Granite pipeline
  const startTime = Date.now()
  let result
  try {
    result = await translateSyllabus(session.rawText, capProfile)
  } catch (err) {
    console.error('[translate] AI pipeline error:', err.message)
    return Response.json(
      { error: true, code: 'AI_ERROR', message: err.message },
      { status: 500 }
    )
  }

  const elapsed = Date.now() - startTime
  console.log(`[translate] Processed ${syllabusId} in ${elapsed}ms`)

  // Convert estimatedHours → estimatedMinutes for UI compatibility
  result.tasks = result.tasks.map(t => ({
    ...t,
    estimatedMinutes: typeof t.estimatedHours === 'number' ? Math.round(t.estimatedHours * 60) : 120
  }))

  // Write to cache
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(join(CACHE_DIR, `${syllabusId}.json`), JSON.stringify(result))
  } catch (err) {
    console.warn('[translate] Cache write failed:', err.message)
  }

  return Response.json(result, { headers: { 'X-Cache': 'MISS' } })
}
