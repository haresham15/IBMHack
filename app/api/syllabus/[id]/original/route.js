import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { syllabusStore } from '@/lib/session-store'

const PDF_CACHE_DIR = join(process.cwd(), 'cache', 'pdfs')

function readFromDisk(id) {
  const linkPath = join(PDF_CACHE_DIR, `${id}.link`)
  const uploadId = existsSync(linkPath) ? readFileSync(linkPath, 'utf8').trim() : id

  const pdfPath = join(PDF_CACHE_DIR, `${uploadId}.pdf`)
  const metaPath = join(PDF_CACHE_DIR, `${uploadId}.meta`)

  if (!existsSync(pdfPath)) return null

  const buffer = readFileSync(pdfPath)
  const filename = existsSync(metaPath) ? readFileSync(metaPath, 'utf8').trim() : 'syllabus.pdf'
  return { buffer, filename }
}

export async function GET(request, { params }) {
  const { id } = params

  const session = syllabusStore.get(id)
  if (session?.buffer) {
    return new Response(session.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${session.filename}"`,
        'Content-Length': String(session.buffer.length)
      }
    })
  }

  const disk = readFromDisk(id)
  if (disk) {
    return new Response(disk.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${disk.filename}"`,
        'Content-Length': String(disk.buffer.length)
      }
    })
  }

  return Response.json(
    {
      error: true,
      code: 'NOT_FOUND',
      message: `Syllabus ${id} not found. It may have expired — please upload the PDF again.`
    },
    { status: 404 }
  )
}
