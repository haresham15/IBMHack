'use client'
import { useEffect } from 'react'
import { useStoredUIConfig } from '@/lib/useUIConfig'

export default function ThemeProvider({ children }) {
    // This hook will read from sessionStorage on mount and call applyThemeToRoot()
    // By wrapping the whole app here, we guarantee it fires on every navigation.
    useStoredUIConfig()

    return <>{children}</>
}
