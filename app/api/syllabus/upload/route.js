import { join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { syllabusStore } from '@/lib/session-store'
import { uploadToCOS } from '@/lib/cos'

const PDF_CACHE_DIR = join(process.cwd(), 'cache', 'pdfs')

export async function POST(request) {
  // Parse FormData
  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json(
      { error: true, code: 'UPLOAD_FAILED', message: 'Failed to parse form data.' },
      { status: 400 }
    )
  }

  const file = formData.get('file')

  // Validate: file exists
  if (!file || typeof file === 'string') {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'No file provided. Include a "file" field in the FormData.' },
      { status: 400 }
    )
  }

  // Validate: file is PDF (by extension)
  const filename = file.name ?? 'upload.pdf'
  if (!filename.toLowerCase().endsWith('.pdf')) {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: `Only PDF files are accepted. Got: ${filename}` },
      { status: 400 }
    )
  }

  // Convert to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract text with pdf-parse v2 class API (dynamic import — avoids bundler issues)
  let rawText
  try {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const textResult = await parser.getText()
    rawText = textResult.text ?? ''
  } catch (err) {
    return Response.json(
      { error: true, code: 'UPLOAD_FAILED', message: `PDF text extraction failed: ${err.message}` },
      { status: 422 }
    )
  }

  // Validate: extracted text long enough to be a real syllabus
  if (rawText.trim().length < 100) {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'PDF text is too short (under 100 characters). Please upload a complete syllabus.' },
      { status: 422 }
    )
  }

  const syllabusId = uuidv4()
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length

  // Store in session
  syllabusStore.set(syllabusId, {
    rawText,
    filename,
    buffer,
    uploadedAt: new Date().toISOString()
  })

  // Persist PDF to disk so the original route can serve it after server restarts
  try {
    mkdirSync(PDF_CACHE_DIR, { recursive: true })
    writeFileSync(join(PDF_CACHE_DIR, `${syllabusId}.pdf`), buffer)
    writeFileSync(join(PDF_CACHE_DIR, `${syllabusId}.meta`), filename)
  } catch (err) {
    console.warn('[upload] Disk cache write failed:', err.message)
  }

  // Fire-and-forget COS upload — errors only warn, never fail the request
  uploadToCOS(buffer, `${syllabusId}-${filename}`).catch(err => {
    console.warn('[COS upload warn]', err.message)
  })

  return Response.json({ syllabusId, filename, wordCount, status: 'uploaded' })
}
