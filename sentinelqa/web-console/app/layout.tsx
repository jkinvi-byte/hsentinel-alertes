import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Les polices de la marque (MARQUE.md), hébergées chez nous : la compilation ne dépend plus de Google Fonts (D-32). Licences OFL dans app/polices.
const schibsted = localFont({ src: './polices/SchibstedGrotesk-VF.ttf', weight: '400 900', variable: '--font-schibsted', display: 'swap' })
const instrument = localFont({
  src: [{ path: './polices/InstrumentSans-VF.ttf', style: 'normal' }, { path: './polices/InstrumentSans-Italic-VF.ttf', style: 'italic' }],
  weight: '400 700', variable: '--font-instrument', display: 'swap',
})
const martian = localFont({ src: './polices/MartianMono-VF.ttf', weight: '100 800', variable: '--font-martian', display: 'swap' })

export const metadata: Metadata = {
  title: 'HSentinel — QA et Pentest',
  description:
    'Préparez vos tests, suivez les agents et examinez les résultats avec leurs preuves.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0e14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${schibsted.variable} ${instrument.variable} ${martian.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
