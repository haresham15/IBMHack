'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/campus-map', label: 'Campus Map' },
  { href: '/upload', label: 'Syllabi' },
  { href: '/onboarding', label: 'My Profile' },
]

export default function Navbar({ showNav = true }) {
  const path = usePathname()
  const [hovered, setHovered] = useState(null)

  if (!showNav) return null

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .vantage-wordmark {
          background: linear-gradient(90deg, #ffffff 0%, #DAEEFB 40%, #ffffff 60%, #DAEEFB 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.4px;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .nav-link-pill {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 13px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 180ms ease, color 180ms ease;
          white-space: nowrap;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .nav-link-pill.active {
          background: rgba(255,255,255,0.18);
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.25);
        }
        .nav-link-pill:not(.active) {
          color: rgba(255,255,255,0.72);
          background: transparent;
        }
        .nav-link-pill:not(.active):hover {
          background: rgba(255,255,255,0.10);
          color: #ffffff;
        }

      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
        zIndex: 200,
        /* Frosted glass dark bar */
        background: 'linear-gradient(90deg, #3a85b8 0%, #5BAACF 50%, #3a85b8 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.2), 0 4px 24px rgba(26,58,82,0.2)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px 0 24px',
      }}>

        {/* ── Wordmark + tagline ── */}
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', textDecoration: 'none' }}>
          <span className="vantage-wordmark">Vantage</span>
          <span style={{
            fontSize: '11px', fontWeight: '500', letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
            fontFamily: 'IBM Plex Sans, sans-serif',
          }}>
            AI · OSU
          </span>
        </Link>

        {/* ── Nav links ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {LINKS.map(({ href, label, icon }) => {
            const isActive = path === href || (href !== '/' && path?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link-pill${isActive ? ' active' : ''}`}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
              >
                {label}

              </Link>
            )
          })}
        </div>


      </nav>
    </>
  )
}
