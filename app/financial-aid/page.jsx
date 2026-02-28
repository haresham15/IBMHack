'use client'
import Navbar from '@/components/Navbar'

export default function FinancialAidPage() {
  return (
    <>
      <Navbar showNav={true} />
      <div style={{
        paddingTop: '48px', minHeight: '100vh',
        backgroundColor: '#F4F4F4', fontFamily: 'IBM Plex Sans, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '16px',
          padding: '56px 48px', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(26,58,82,0.10)',
          border: '1px solid #E0E0E0', maxWidth: '480px', width: '100%'
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>💰</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1A3A52', marginBottom: '12px' }}>
            Financial Aid
          </h2>
          <p style={{ fontSize: '15px', color: '#525252', lineHeight: 1.6, marginBottom: '0' }}>
            Financial aid resources and tools are coming soon. Check back later for FAFSA guidance, scholarship search, and deadline tracking.
          </p>
        </div>
      </div>
    </>
  )
}
