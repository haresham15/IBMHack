'use client'

export default function AgentAlert({ alert, onAction }) {
  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15,98,254,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(15,98,254,0); }
        }
      `}</style>
      <div style={{
        backgroundColor: '#0F62FE',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: alert.urgent ? 'pulse-glow 2s infinite' : 'none'
      }}>
        <span style={{ fontSize: '24px' }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', opacity: 0.8 }}>
            Trigger: Critical Deadline in CAP Horizon
          </div>
          <span style={{ fontSize: '15px' }}>{alert.message}</span>
        </div>
        {alert.cta && (
          <button
            onClick={onAction}
            style={{
              backgroundColor: '#FFFFFF', color: '#0F62FE',
              fontWeight: 'bold', fontSize: '14px',
              border: 'none', borderRadius: '6px',
              padding: '8px 16px', cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
            {alert.cta}
          </button>
        )}
      </div>
    </>
  )
}
