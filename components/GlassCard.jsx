// Reusable Glassmorphism card — the foundation of the Bento UI.
// Combine with style prop for per-instance overrides.
export default function GlassCard({ children, style, className, onClick, onMouseEnter, onMouseLeave }) {
    return (
        <div
            className={className}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                backdropFilter: 'blur(14px) saturate(160%)',
                WebkitBackdropFilter: 'blur(14px) saturate(160%)',
                backgroundColor: 'rgba(255, 255, 255, 0.72)',
                border: '1px solid rgba(255, 255, 255, 0.55)',
                borderRadius: '20px',
                boxShadow: '0 4px 28px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)',
                ...style,
            }}
        >
            {children}
        </div>
    )
}
