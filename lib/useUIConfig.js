/**
 * lib/useUIConfig.js
 * React hook: fetches the ML-predicted UI config for the current student
 * and returns both the raw config + a pre-computed theme object ready for inline styles.
 */

import { useState, useEffect } from 'react'

// ── Color palettes per theme ───────────────────────────────────────────────
const THEMES = {
    cream: {
        bg: '#FDF6E3',
        bgAlt: '#F5F0DC',
        text: '#1A1410',
        accent: '#3B6FA0',
        surface: '#FAFAF5',
        border: '#E8DFC8',
        subtext: '#5A4E3A',
    },
    dark: {
        bg: '#1A1D2E',
        bgAlt: '#22253A',
        text: '#DADAE8',
        accent: '#7B6FA0',
        surface: '#252840',
        border: '#383B5A',
        subtext: '#9090A8',
    },
    warm: {
        bg: '#F5F0E8',
        bgAlt: '#EDE8DF',
        text: '#3A3028',
        accent: '#4A9E9E',
        surface: '#FAF7F2',
        border: '#DDD5C5',
        subtext: '#6B5E50',
    },
    calm: {
        bg: '#F5F8FB',
        bgAlt: '#EBF0F5',
        text: '#1E2533',
        accent: '#069494',
        surface: '#FFFFFF',
        border: '#D0DCE8',
        subtext: '#5A6A7A',
    },
    neutral: {
        bg: '#F8F9FA',
        bgAlt: '#EFF2F7',
        text: '#2C2C2C',
        accent: '#4A90C4',
        surface: '#FFFFFF',
        border: '#E4E7ED',
        subtext: '#525252',
    },
}

// ── Font family stacks ─────────────────────────────────────────────────────
const FONTS = {
    inter: '"Inter", "IBM Plex Sans", sans-serif',
    lexend: '"Lexend", "Open Sans", sans-serif',
    atkinson: '"Atkinson Hyperlegible", "Verdana", sans-serif',
    nunito: '"Nunito", "Open Sans", sans-serif',
    opendyslexic: '"OpenDyslexic", "Comic Sans MS", cursive',
}

// ── Font size scales ────────────────────────────────────────────────────────
const FONT_SIZES = {
    default: { body: '15px', heading: '24px', small: '13px', lineHeight: '1.6' },
    large: { body: '17px', heading: '26px', small: '14px', lineHeight: '1.7' },
    xl: { body: '19px', heading: '28px', small: '15px', lineHeight: '1.85' },
}

export function buildTheme(config) {
    const palette = THEMES[config?.color_theme] || THEMES.neutral
    const fontStack = FONTS[config?.font_family] || FONTS.inter
    const sizes = FONT_SIZES[config?.font_size] || FONT_SIZES.default

    return {
        // Colours
        ...palette,
        // Typography
        fontFamily: fontStack,
        fontSize: sizes.body,
        fontSizeH: sizes.heading,
        fontSizeS: sizes.small,
        lineHeight: sizes.lineHeight,
        // Behaviour flags
        reduceMotion: config?.motion !== 'on',
        largeTargets: config?.large_targets ?? false,
        readAloud: config?.read_aloud ?? false,
        progressBars: config?.progress_bars ?? true,
        noTimers: config?.no_timers ?? false,
        infoMinimal: config?.info_density === 'minimal',
        // Raw config
        raw: config,
    }
}

const DEFAULT_CONFIG = {
    color_theme: 'neutral',
    font_family: 'inter',
    font_size: 'default',
    motion: 'reduced',
    info_density: 'moderate',
    large_targets: false,
    read_aloud: false,
    progress_bars: true,
    no_timers: false,
}

export function useUIConfig(capProfile) {
    const [theme, setTheme] = useState(() => buildTheme(DEFAULT_CONFIG))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!capProfile) return

        // Read disorders from localStorage (saved during onboarding)
        let disorders = []
        try {
            const stored = localStorage.getItem('vantage_disorders')
            if (stored) disorders = JSON.parse(stored)
        } catch { /* ignore */ }

        const profileWithDisorders = { ...capProfile, disorders }

        fetch('/api/ui-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capProfile: profileWithDisorders }),
        })
            .then(r => r.json())
            .then(data => {
                const config = data?.ui_config || DEFAULT_CONFIG
                setTheme(buildTheme(config))
                // Store in sessionStorage so other pages can read it without refetching
                sessionStorage.setItem('vantage_ui_config', JSON.stringify(config))
            })
            .catch(() => {
                // Keep defaults silently
            })
            .finally(() => setLoading(false))
    }, [capProfile])

    return { theme, loading }
}

/** Lightweight version for pages that don't have capProfile handy */
export function useStoredUIConfig() {
    const [theme, setTheme] = useState(() => buildTheme(DEFAULT_CONFIG))

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('vantage_ui_config')
            if (stored) setTheme(buildTheme(JSON.parse(stored)))
        } catch { /* ignore */ }
    }, [])

    return theme
}
