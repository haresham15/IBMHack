import '@fontsource/ibm-plex-sans'
import '@fontsource/ibm-plex-sans/600.css'
import DemoReset from '@/components/DemoReset'
import ThemeProvider from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <title>Vantage — AI for Every Campus Brain</title>
        <meta name='description' content='Vantage uses IBM Granite to turn your syllabus into a personalised task list, proactively alerts you to deadlines, and walks you through complex university forms.' />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Atkinson+Hyperlegible:wght@400;700&family=Nunito:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body style={{ fontFamily: 'var(--font, IBM Plex Sans, sans-serif)', margin: 0, backgroundColor: 'var(--bg, #F4F4F4)', color: 'var(--text, #161616)', transition: 'background-color 400ms ease, color 400ms ease' }}>
        <DemoReset />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

