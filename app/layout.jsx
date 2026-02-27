import '@fontsource/ibm-plex-sans'
import '@fontsource/ibm-plex-sans/600.css'

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head><title>Vantage — AI for Every Campus Brain</title></head>
      <body style={{ fontFamily: 'IBM Plex Sans, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
