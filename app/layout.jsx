import '@fontsource/ibm-plex-sans'
import '@fontsource/ibm-plex-sans/600.css'
import DemoReset from '@/components/DemoReset'

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <title>Vantage — AI for Every Campus Brain</title>
        <meta name='description' content='Vantage uses IBM Granite to turn your syllabus into a personalised task list, proactively alerts you to deadlines, and walks you through complex university forms.' />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
      </head>
      <body style={{ fontFamily: 'IBM Plex Sans, sans-serif', margin: 0 }}>
        <DemoReset />
        {children}
      </body>
    </html>
  )
}
