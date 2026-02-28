'use client'
import { useStoredUIConfig } from '@/lib/useUIConfig'

export default function ThemeProvider({ children }) {
    const theme = useStoredUIConfig()

    return (
        <div style={{
            '--bg': theme.bg,
            '--bg-alt': theme.bgAlt,
            '--text': theme.text,
            '--accent': theme.accent,
            '--surface': theme.surface,
            '--border': theme.border,
            '--subtext': theme.subtext,
            '--font': theme.fontFamily,
            '--fz-body': theme.fontSize,
            '--fz-head': theme.fontSizeH,
            '--fz-small': theme.fontSizeS,
            '--lh': theme.lineHeight,
            '--min-tap': theme.largeTargets ? '52px' : '44px',
            minHeight: '100vh',
            backgroundColor: theme.bg || 'var(--bg, #F4F4F4)',
            color: theme.text || 'var(--text, #161616)',
            fontFamily: theme.fontFamily || 'var(--font, IBM Plex Sans, sans-serif)',
            transition: 'background-color 400ms ease, color 400ms ease'
        }}>
            {children}
        </div>
    )
}
