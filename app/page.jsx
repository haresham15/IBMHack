'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FEATURE_DETAILS = {
  'Syllabus → Tasks': {
    icon: '📄',
    desc: 'Upload any course syllabus PDF and Vantage instantly extracts every assignment, exam, and deadline — turning them into a prioritised, personalised task list powered by IBM Granite.'
  },
  'Neurodivergent-first': {
    icon: '🧠',
    desc: 'Vantage adapts its colours, fonts, layout density, and motion to suit how your brain works best — whether you have ADHD, dyslexia, ASD, anxiety, or sensory sensitivities.'
  },
  'Campus Map': {
    icon: '🗺️',
    desc: 'Find buildings, classrooms, dining halls, and accessibility routes across campus. Tap any location to get directions and see opening hours.'
  },
  'Priority Engine': {
    icon: '🎯',
    desc: 'Tasks are ranked by due date, estimated effort, and your personal time horizon — so you always know what to focus on next without getting overwhelmed.'
  },
}

export default function Home() {
  const [openPill, setOpenPill] = useState(null)

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #DAEEFB 0%, #A8D8EA 40%, #5BAACF 100%)',
      fontFamily: 'IBM Plex Sans, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '480px', height: '480px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', pointerEvents: 'none'
      }} />

      {/* Nav bar */}
      <header style={{
        padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ color: '#1A3A52', fontWeight: 'bold', fontSize: '22px', letterSpacing: '-0.5px' }}>Vantage</span>
          <span style={{ color: 'rgba(26,58,82,0.5)', fontSize: '13px' }}>AI for Every Brain</span>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(26,58,82,0.4)' }}>IBM SkillsBuild Hackathon 2026</div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', gap: '80px', flexWrap: 'wrap'
      }}>
        {/* Left: hero copy */}
        <div style={{ maxWidth: '480px', flex: '1 1 320px' }}>
          <div style={{
            display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.35)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: '20px', padding: '4px 14px', fontSize: '12px',
            color: '#1A3A52', marginBottom: '20px', letterSpacing: '0.5px'
          }}>
            Powered by IBM Granite &amp; WatsonX
          </div>
          <h1 style={{
            fontSize: '56px', fontWeight: '800', color: '#1A3A52',
            lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px'
          }}>
            Your campus.<br />
            <span style={{ color: '#2471A3' }}>Your pace.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(26,58,82,0.75)', lineHeight: 1.6, marginBottom: '36px' }}>
            Vantage reads your syllabus and turns it into a personalised task list — built around how <em>your</em> brain works.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(FEATURE_DETAILS).map(([label, { icon }]) => {
              const isOpen = openPill === label
              return (
                <div key={label} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenPill(isOpen ? null : label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: isOpen ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${isOpen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}`,
                      borderRadius: '8px', padding: '6px 14px',
                      fontSize: '13px', color: '#1A3A52',
                      cursor: 'pointer', transition: 'all 150ms',
                      boxShadow: isOpen ? '0 2px 12px rgba(26,58,82,0.12)' : 'none',
                      fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: isOpen ? '600' : '400'
                    }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.55)' }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)' }}
                  >
                    <span>{icon}</span><span>{label}</span>
                  </button>

                  {isOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                      width: '260px', zIndex: 10,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px', padding: '14px 16px',
                      boxShadow: '0 8px 32px rgba(26,58,82,0.18)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      fontSize: '13px', color: '#1A3A52', lineHeight: 1.55,
                      animation: 'pillFadeIn 150ms ease'
                    }}>
                      <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px' }}>
                        {icon} {label}
                      </div>
                      {FEATURE_DETAILS[label].desc}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <style>{`@keyframes pillFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:none } }`}</style>
        </div>

        {/* Right: sign-in card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 24px 64px rgba(26,58,82,0.2)',
          width: '100%', maxWidth: '380px', flex: '0 0 auto'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4A90C4', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Get Started Free
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#161616', marginBottom: '8px', lineHeight: 1.2 }}>
            Welcome to Vantage
          </h2>
          <p style={{ fontSize: '14px', color: '#525252', marginBottom: '28px', lineHeight: 1.5 }}>
            Sign in to access your personalised academic dashboard.
          </p>

          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', padding: '14px 20px',
              border: '1.5px solid #E0E0E0', borderRadius: '10px',
              backgroundColor: '#FFFFFF', fontSize: '15px', fontWeight: '600',
              color: '#161616', cursor: 'pointer',
              transition: 'all 150ms', marginBottom: '16px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#4A90C4'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,98,254,0.15)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E0E0E0'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
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

          <p style={{ fontSize: '11px', color: '#A8A8A8', textAlign: 'center', lineHeight: 1.5 }}>
            By continuing, you agree to use this app responsibly.<br />No spam. No data selling.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 40px', textAlign: 'center', fontSize: '11px', color: 'rgba(26,58,82,0.45)' }}>
        Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2026
      </footer>
    </div>
  )
}
