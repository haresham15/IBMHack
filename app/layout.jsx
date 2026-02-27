import '@fontsource/ibm-plex-sans'
import '@fontsource/ibm-plex-sans/600.css'
import './globals.css'
import DemoReset from '@/components/DemoReset'

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <title>Vantage — AI for Every Campus Brain</title>
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <meta name='description' content='AI-powered accessibility layer for neurodivergent university students' />
      </head>
      <body style={{ fontFamily: 'IBM Plex Sans, sans-serif', margin: 0 }}>
        <DemoReset />
        {children}
      </body>
    </html>
  )
}
