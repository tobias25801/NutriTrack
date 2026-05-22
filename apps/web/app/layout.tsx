import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'NutriTrack — Free Nutrition & Calorie Tracker',
    template: '%s | NutriTrack',
  },
  description:
    'Track calories, macros, and nutrition for free. Includes AI meal analysis, barcode scanner, meal plans, and beautiful analytics.',
  keywords: ['calorie tracker', 'nutrition tracker', 'meal planning', 'macros', 'diet app'],
  authors: [{ name: 'NutriTrack' }],
  creator: 'NutriTrack',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nutritrack.app',
    title: 'NutriTrack — Free Nutrition & Calorie Tracker',
    description: 'Track calories, macros, and nutrition for free.',
    siteName: 'NutriTrack',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NutriTrack',
    description: 'Track calories, macros, and nutrition for free.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-nt-bg`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
