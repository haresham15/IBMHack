import { join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

const PDF_CACHE_DIR = join(process.cwd(), 'cache', 'pdfs')

// POST { supabaseId, syllabusId }
// Creates a mapping file so the original route can find the PDF by Supabase ID.
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: true, message: 'Invalid JSON.' }, { status: 400 })
  }

  const { supabaseId, syllabusId } = body ?? {}
  if (!supabaseId || !syllabusId) {
    return Response.json({ error: true, message: 'supabaseId and syllabusId are required.' }, { status: 400 })
  }

  try {
    mkdirSync(PDF_CACHE_DIR, { recursive: true })
    writeFileSync(join(PDF_CACHE_DIR, `${supabaseId}.link`), syllabusId)
  } catch (err) {
    console.warn('[link-pdf] Failed to write link file:', err.message)
    return Response.json({ error: true, message: 'Failed to save link.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
