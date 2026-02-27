export async function POST() {
  return Response.json({
    syllabusId: 'syllabus-demo-001',
    filename: 'demo-syllabus.pdf',
    wordCount: 1240,
    status: 'uploaded'
  })
}
