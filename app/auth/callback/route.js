import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if CAP profile exists
        const { data: cap } = await supabase
          .from('cap_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cap) {
          return NextResponse.redirect(new URL('/dashboard', origin))
        } else {
          return NextResponse.redirect(new URL('/onboarding', origin))
        }
      }
    }
  }

  // Fallback: redirect to home with error
  return NextResponse.redirect(new URL('/?error=auth', origin))
}
