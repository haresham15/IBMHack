import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'

// Load the map only in the browser — mapbox-gl accesses window/WebGL APIs
// that do not exist in the server-side rendering environment.
const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0F62FE11, #F4F4F4)',
      fontFamily: 'IBM Plex Sans, sans-serif', gap: '12px'
    }}>
      <div style={{ fontSize: '32px' }}>🗺️</div>
      <p style={{ color: '#525252', fontSize: '15px', margin: 0 }}>Loading 3D Campus Map…</p>
    </div>
  )
})

export const metadata = {
  title: 'Campus Map — Vantage'
}

export default function CampusMapPage() {
  return (
    <>
      <Navbar showNav={true} />
      {/*
        The map container is fixed below the 48px navbar and fills the remaining
        viewport so the 3-D view is fully immersive with no scroll / overflow.
      */}
      <div style={{
        position: 'fixed',
        top: '48px',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}>
        <CampusMap />
      </div>
    </>
  )
}
