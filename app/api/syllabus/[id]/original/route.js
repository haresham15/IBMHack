import { syllabusStore } from '@/lib/session-store'

export async function GET(request, { params }) {
  const { id } = params
  const session = syllabusStore.get(id)

  if (!session || !session.buffer) {
    return Response.json(
      {
        error: true,
        code: 'NOT_FOUND',
        message: `Syllabus ${id} not found. It may have expired — please upload the PDF again.`
      },
      { status: 404 }
    )
  }

  return new Response(session.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${session.filename}"`,
      'Content-Length': String(session.buffer.length)
    }
  })
}
