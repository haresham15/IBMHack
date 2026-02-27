export default function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      backgroundColor: '#FFF5F5', border: '1px solid #DA1E28',
      borderRadius: '8px', padding: '20px',
      display: 'flex', alignItems: 'center', gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>❌</span>
      <span style={{ color: '#DA1E28', fontSize: '14px', flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          backgroundColor: '#DA1E28', color: '#FFFFFF',
          border: 'none', borderRadius: '6px',
          padding: '8px 16px', cursor: 'pointer', fontSize: '14px'
        }}>Retry</button>
      )}
    </div>
  )
}
