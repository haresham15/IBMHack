'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ─── Calm-mode palette ───────────────────────────────────── */
const C = {
    bg: '#E8EDE6',   // warm grey-green background
    bgCard: '#F0F4EE',   // slightly lighter sage card
    text: '#4A5548',   // muted dark sage
    textSoft: '#7A877A',   // softer text
    accent: '#8FA88D',   // sage green accent
    accentSoft: '#B5C7B3',   // softer sage
    toast: '#DDE5DA',   // toast background
    toastText: '#5A6B58',   // toast content
    undoAccent: '#6B8B6A',   // undo button
    breathe: '#A3BFA1',   // breathing circle colour
}

const FONT = "'Nunito', 'SF Pro Rounded', 'IBM Plex Sans', sans-serif"

/* ─── Breathing circle SVG ─────────────────────────────────── */
function BreathingCircle() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <circle cx="10" cy="10" r="7" fill="none" stroke={C.breathe}
                strokeWidth="2" opacity="0.6">
                <animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="10" r="3" fill={C.breathe} opacity="0.5">
                <animate attributeName="r" values="2;4;2" dur="4s" repeatCount="indefinite" />
            </circle>
        </svg>
    )
}

/* ─── Undo icon (counter-clockwise arrow) ──────────────────── */
function UndoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={C.undoAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginRight: '4px' }}>
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1 0 2.1-5.3L3 7" />
        </svg>
    )
}

export default function CalmDashboard() {
    const router = useRouter()
    const [cap, setCap] = useState(null)
    const [toastVisible, setToastVisible] = useState(true)
    const [toastUndone, setToastUndone] = useState(false)
    const [cardVisible, setCardVisible] = useState(false)

    useEffect(() => {
        const raw = localStorage.getItem('vantage_cap')
        if (!raw) { router.push('/onboarding'); return }
        setCap(JSON.parse(raw))
        // Gentle spawn delay for the contextual card
        const t = setTimeout(() => setCardVisible(true), 600)
        return () => clearTimeout(t)
    }, [router])

    function handleUndo() {
        setToastUndone(true)
        setTimeout(() => setToastVisible(false), 1200)
    }

    if (!cap) return null
    const name = cap.displayName || 'there'

    return (
        <>
            <style>{`
        @keyframes gentleFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes toastFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; transform: translateY(10px); }
        }
        @keyframes breathePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

            <div style={{
                minHeight: '100vh',
                background: `linear-gradient(180deg, ${C.bg} 0%, #DEE4DB 100%)`,
                fontFamily: FONT,
                display: 'flex',
                flexDirection: 'column',
                color: C.text
            }}>

                {/* ─── Top Navigation ───────────────────────────────── */}
                <header style={{
                    padding: '20px 24px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            fontSize: '22px', fontWeight: '600',
                            color: C.accent, letterSpacing: '-0.3px'
                        }}>Vantage</span>
                        <BreathingCircle />
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', color: C.textSoft, fontWeight: '500'
                    }}>
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: C.breathe, display: 'inline-block'
                        }} />
                        Calm Mode
                    </div>
                </header>

                {/* ─── Gentle greeting ──────────────────────────────── */}
                <div style={{
                    padding: '24px 28px 0',
                    fontSize: '17px', fontWeight: '500',
                    color: C.textSoft, lineHeight: 1.5
                }}>
                    Hi {name}. Here&apos;s what matters right now.
                </div>

                {/* ─── Main Content — vast negative space + card ─────── */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0 24px',
                    minHeight: '50vh'
                }}>
                    {/* Dynamic Contextual Card */}
                    <div style={{
                        backgroundColor: C.bgCard,
                        borderRadius: '24px',
                        padding: '36px 32px',
                        maxWidth: '380px',
                        width: '100%',
                        textAlign: 'center',
                        opacity: cardVisible ? 1 : 0,
                        transform: cardVisible ? 'none' : 'translateY(12px) scale(0.98)',
                        transition: 'opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1)',
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 1px ${C.accentSoft}22`
                    }}>
                        {/* Contextual icon */}
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            backgroundColor: `${C.accent}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', fontSize: '22px'
                        }}>📚</div>

                        <div style={{
                            fontSize: '20px', fontWeight: '600',
                            color: C.text, lineHeight: 1.4, marginBottom: '8px'
                        }}>
                            Psych 101 ends in 10 minutes.
                        </div>

                        <div style={{
                            fontSize: '14px', color: C.textSoft,
                            marginBottom: '24px', lineHeight: 1.5
                        }}>
                            Your next quiet window starts after this class.
                        </div>

                        {/* Call to Action — muted pill button */}
                        <button
                            onClick={() => router.push('/map')}
                            style={{
                                backgroundColor: C.accent,
                                color: '#F5F8F4',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '14px 28px',
                                fontSize: '15px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 300ms, transform 200ms',
                                letterSpacing: '0.2px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = C.undoAccent
                                e.currentTarget.style.transform = 'scale(1.02)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = C.accent
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            Find Quiet Route to Dorm
                        </button>
                    </div>
                </main>

                {/* ─── Agent Action Toast (Undo Loop) ────────────────── */}
                {toastVisible && (
                    <div style={{
                        position: 'fixed',
                        bottom: '28px',
                        left: '16px',
                        right: '16px',
                        animation: toastUndone
                            ? 'toastFadeOut 800ms ease forwards'
                            : 'toastSlideUp 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                        zIndex: 50
                    }}>
                        <div style={{
                            backgroundColor: C.toast,
                            borderRadius: '18px',
                            padding: '14px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            maxWidth: '420px',
                            margin: '0 auto',
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1px ${C.accentSoft}33`
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                fontSize: '13px', color: C.toastText, fontWeight: '500',
                                lineHeight: 1.4, flex: 1
                            }}>
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>🤫</span>
                                {toastUndone
                                    ? 'Notifications restored.'
                                    : 'Vantage Agent muted non-essential notifications.'}
                            </div>

                            {!toastUndone && (
                                <button
                                    onClick={handleUndo}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        background: 'none', border: 'none',
                                        color: C.undoAccent, fontSize: '14px',
                                        fontWeight: '600', cursor: 'pointer',
                                        padding: '6px 10px', borderRadius: '12px',
                                        marginLeft: '12px', whiteSpace: 'nowrap',
                                        transition: 'background 200ms'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${C.accentSoft}44`}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <UndoIcon />
                                    Undo
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Bottom soft nav hint ──────────────────────────── */}
                <nav style={{
                    padding: '12px 24px 20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '32px'
                }}>
                    {[
                        { href: '/dashboard', label: 'Full View', icon: '📋' },
                        { href: '/map', label: 'Quiet Spaces', icon: '🗺️' },
                        { href: '/upload', label: 'Upload', icon: '📄' }
                    ].map(item => (
                        <Link key={item.href} href={item.href} style={{
                            textDecoration: 'none',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '4px',
                            fontSize: '11px', color: C.textSoft,
                            fontWeight: '500', fontFamily: FONT
                        }}>
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    )
}
