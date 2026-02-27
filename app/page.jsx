'use client'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F62FE 0%, #001D6C 100%)',
      fontFamily: 'IBM Plex Sans, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '12px' }}>
          Vantage
        </div>
        <div style={{ fontSize: '18px', color: '#93C5FD', marginBottom: '48px', lineHeight: 1.5 }}>
          AI-powered academic support designed for every campus brain.
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>
            Get Started
          </div>
          <div style={{ fontSize: '14px', color: '#525252', marginBottom: '28px' }}>
            Sign in to save your profile and access your personalized task list from any device.
          </div>

          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 24px',
              border: '2px solid #E0E0E0',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              color: '#161616',
              cursor: 'pointer',
              transition: 'border-color 150ms, box-shadow 150ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#0F62FE'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,98,254,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E0E0E0'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#93C5FD' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </div>
  )
}
