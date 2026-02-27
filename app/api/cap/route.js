export async function POST(request) {
  const body = await request.json()
  return Response.json({
    capProfile: {
      displayName: body.answers?.find(a => a.questionId === 'q5')?.answer || 'Student',
      informationDensity: 'moderate',
      timeHorizon: '72h',
      sensoryFlags: ['loud'],
      supportLevel: 'step-by-step',
      sessionId: crypto.randomUUID()
    }
  })
}
