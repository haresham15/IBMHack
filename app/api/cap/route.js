import { buildCAP } from '@/lib/cap/engine'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  const { answers } = body ?? {}

  if (!Array.isArray(answers) || answers.length === 0) {
    return Response.json(
      { error: true, code: 'VALIDATION_ERROR', message: 'answers must be a non-empty array.' },
      { status: 400 }
    )
  }

  let capResult
  try {
    capResult = buildCAP(answers)
  } catch (err) {
    return Response.json(
      { error: true, code: 'CAP_BUILD_ERROR', message: err.message ?? 'Failed to build CAP.' },
      { status: 500 }
    )
  }

  return Response.json({
    capProfile: {
      displayName: capResult.displayName,
      informationDensity: capResult.informationDensity,
      timeHorizon: capResult.timeHorizon,
      sensoryFlags: capResult.sensoryFlags,
      supportLevel: capResult.supportLevel,
      sessionId: crypto.randomUUID()
    }
  })
}
