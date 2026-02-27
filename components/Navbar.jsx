'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar({ showNav = true }) {
  const pathname = usePathname()
  if (!showNav) return null

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
      background: 'linear-gradient(90deg, #0F62FE 0%, #0043CE 100%)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 32px', zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)'
    }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '22px', letterSpacing: '-0.3px' }}>Vantage</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '400', letterSpacing: '0.5px' }}>AI FOR EVERY BRAIN</span>
      </Link>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[{ href: '/dashboard', label: 'Dashboard' }, { href: '/upload', label: 'Upload' }].map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
              fontSize: '14px', fontWeight: active ? '600' : '400',
              textDecoration: 'none', padding: '6px 14px', borderRadius: '6px',
              backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'background 150ms, color 150ms'
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = active ? '#FFFFFF' : 'rgba(255,255,255,0.75)' }}>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
