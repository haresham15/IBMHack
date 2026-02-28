'use client'
import Link from 'next/link'

export default function Navbar({ showNav = true }) {
  if (!showNav) return null
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '48px',
      backgroundColor: 'var(--accent, #0F62FE)', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px', zIndex: 100,
      transition: 'background-color 400ms ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span aria-label="Vantage Home" style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '20px' }}>Vantage</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>AI for Every Brain</span>
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <Link href="/dashboard" style={{ color: '#FFFFFF', fontSize: '14px', textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
          onMouseLeave={e => e.target.style.textDecoration = 'none'}>
          Dashboard
        </Link>
        <Link href="/upload" style={{ color: '#FFFFFF', fontSize: '14px', textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
          onMouseLeave={e => e.target.style.textDecoration = 'none'}>
          Upload
        </Link>
        <Link href="/campus-map" style={{ color: '#FFFFFF', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
          🗺️ Campus Map
        </Link>
      </div>
    </nav>
  )
}
