'use client'

export default function AgentAlert({ alert, onAction }) {
  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(15,98,254,0.3); }
          50% { box-shadow: 0 4px 32px rgba(15,98,254,0.6); }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, #0F62FE 0%, #0043CE 100%)',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: alert.urgent ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        boxShadow: '0 4px 20px rgba(15,98,254,0.25)'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0
        }}>🔔</div>
        <span style={{ fontSize: '15px', flex: 1, lineHeight: 1.5 }}>{alert.message}</span>
        {alert.cta && (
          <button onClick={onAction} style={{
            backgroundColor: '#FFFFFF', color: '#0F62FE',
            fontWeight: '700', fontSize: '14px',
            border: 'none', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 100ms'
          }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            {alert.cta}
          </button>
        )}
      </div>
    </>
  )
}
