import { buildCAP } from '@/lib/cap/engine'
import { createClient } from '@/lib/supabase/server'

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

  // Save to Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: true, code: 'UNAUTHORIZED', message: 'Not authenticated.' },
      { status: 401 }
    )
  }

  const { error: dbError } = await supabase.from('cap_profiles').upsert({
    user_id: user.id,
    display_name: capResult.displayName,
    information_density: capResult.informationDensity,
    time_horizon: capResult.timeHorizon,
    sensory_flags: capResult.sensoryFlags,
    support_level: capResult.supportLevel,
    disorders: capResult.disorders ?? []
  }, { onConflict: 'user_id' })

  if (dbError) {
    return Response.json(
      { error: true, code: 'DB_ERROR', message: dbError.message },
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
      disorders: capResult.disorders ?? []
    }
  })
}
