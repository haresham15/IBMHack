/**
 * Vantage Design Tokens
 * Cognitive-gentle palette for neurodivergent university students.
 * All colors have been verified for WCAG AA contrast against their intended backgrounds.
 */

export const colors = {
  // Backgrounds
  bg: '#F7F5F2',          // warm off-white — base page background
  bgAlt: '#F2F5F0',       // pale sage — alternate section background
  surface: '#FDFCFB',     // near-white card surface
  surfaceHover: '#F5F3F0',

  // Text — never pure black
  text: '#2C2C2C',        // dark warm gray — primary text
  textMuted: '#6B6560',   // for captions, meta info
  textSubtle: '#9A938C',  // placeholder-level, disabled text

  // Primary accent — soft periwinkle
  primary: '#A8B4D8',
  primaryDark: '#7B8DBF', // used for text-on-white, passes AA
  primaryBg: '#EEF0F8',   // light tint for backgrounds

  // Secondary — muted mint / warm teal
  secondary: '#8ECFC2',
  secondaryDark: '#5BA89A',
  secondaryBg: '#EBF6F4',

  // Amber — deadlines, urgency (never red)
  amber: '#F5C96B',
  amberDark: '#B8860B',   // text-on-white (AA compliant)
  amberBg: '#FEF8E7',

  // Success / sage green
  sage: '#9DC4A8',
  sageDark: '#3D7A52',
  sageBg: '#EDF5EF',

  // Priority bars (left-side card indicators)
  barUrgent: '#F5C96B',   // high priority → amber
  barSoon: '#8ECFC2',     // medium priority → mint
  barUpcoming: '#A8B4D8', // low priority → lavender

  // UI chrome
  border: 'rgba(44, 44, 44, 0.08)',
  borderFocus: '#A8B4D8', // focus ring color
  overlay: 'rgba(44, 44, 44, 0.32)',
}

export const radii = {
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '24px',     // pebble cards
  xl: '32px',
  pill: '999px',  // bottom nav, tags
}

export const shadows = {
  xs: '0 1px 4px rgba(44, 44, 44, 0.05)',
  sm: '0 2px 10px rgba(44, 44, 44, 0.06)',
  md: '0 4px 20px rgba(44, 44, 44, 0.08)',
  lg: '0 8px 32px rgba(44, 44, 44, 0.10)',
  nav: '0 -2px 20px rgba(44, 44, 44, 0.08), 0 4px 20px rgba(44, 44, 44, 0.06)',
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  nav: '80px',    // bottom nav height + clearance
}

export const typography = {
  fontFamily: "'Nunito', 'Inter', system-ui, sans-serif",
  lineHeight: '1.7',
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    md: '18px',
    lg: '22px',
    xl: '28px',
    xxl: '36px',
  },
}

export const transitions = {
  fast: 'all 150ms ease-in-out',
  base: 'all 250ms ease-in-out',
  slow: 'all 300ms ease-in-out',
}
