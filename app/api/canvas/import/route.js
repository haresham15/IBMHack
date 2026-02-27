import { v4 as uuidv4 } from 'uuid'
import { syllabusStore } from '@/lib/session-store'

const CANVAS_BASE = 'https://osu.instructure.com'

export async function POST(request) {
  const token = process.env.CANVAS_API_KEY
  if (!token) return Response.json({ error: 'No Canvas token configured' }, { status: 500 })

  let courseId
  try {
    const body = await request.json()
    courseId = body.courseId
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!courseId) return Response.json({ error: 'courseId is required' }, { status: 400 })

  try {
    const headers = { Authorization: `Bearer ${token}` }

    const [courseRes, assignRes] = await Promise.all([
      fetch(`${CANVAS_BASE}/api/v1/courses/${courseId}?include[]=syllabus_body`, { headers }),
      fetch(`${CANVAS_BASE}/api/v1/courses/${courseId}/assignments?per_page=100&order_by=due_at`, { headers })
    ])

    if (!courseRes.ok) throw new Error(`Canvas course fetch failed: ${courseRes.status}`)
    if (!assignRes.ok) throw new Error(`Canvas assignments fetch failed: ${assignRes.status}`)

    const course = await courseRes.json()
    const assignments = await assignRes.json()

    // Format as plain text for Granite — same shape as extracted PDF text
    const lines = [
      `Course: ${course.name}`,
      `Course Code: ${course.course_code ?? 'N/A'}`,
      '',
      'ASSIGNMENTS AND ASSESSMENTS:',
      ''
    ]

    for (const a of assignments) {
      if (!a.name) continue
      const due = a.due_at ? new Date(a.due_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No due date'
      const pts = a.points_possible != null ? ` (${a.points_possible} pts)` : ''
      const types = Array.isArray(a.submission_types) ? a.submission_types.join(', ') : ''
      lines.push(`- ${a.name}${pts}`)
      lines.push(`  Due: ${due}`)
      if (types && types !== 'none') lines.push(`  Type: ${types}`)
      lines.push('')
    }

    if (assignments.length === 0) lines.push('No assignments found for this course.')

    const rawText = lines.join('\n')
    const syllabusId = uuidv4()

    syllabusStore.set(syllabusId, {
      rawText,
      filename: `canvas-${courseId}.txt`,
      uploadedAt: new Date().toISOString()
    })

    return Response.json({ syllabusId, courseName: course.name, assignmentCount: assignments.length })
  } catch (err) {
    console.error('[canvas/import]', err.message)
    return Response.json({ error: err.message }, { status: 502 })
  }
}
