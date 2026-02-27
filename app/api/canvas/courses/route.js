const CANVAS_BASE = 'https://osu.instructure.com'

export async function GET() {
  const token = process.env.CANVAS_API_KEY
  if (!token) return Response.json({ error: 'No Canvas token configured' }, { status: 500 })

  try {
    const res = await fetch(
      `${CANVAS_BASE}/api/v1/courses?enrollment_state=active&per_page=30&include[]=term`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Canvas responded ${res.status}`)
    const courses = await res.json()

    const filtered = courses
      .filter(c => c.name && !c.access_restricted_by_date)
      .map(c => ({ id: c.id, name: c.name, courseCode: c.course_code, term: c.term?.name ?? null }))

    return Response.json({ courses: filtered })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }
}
