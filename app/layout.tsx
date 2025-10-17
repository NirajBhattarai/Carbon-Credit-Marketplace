import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/auth/context'
import { Navigation } from '@/components/layout/Navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import { AuthenticationHandler } from '@/components/auth/AuthenticationHandler'
import { MQTTProvider } from '@/lib/mqtt/context'
import { headers } from 'next/headers'
import ContextProvider from '@/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EcoTrade - The Future of Carbon Credit Trading',
  description: 'Trade verified carbon credits with blockchain-powered transparency. Join the $250B carbon credit revolution.',
  keywords: 'carbon credits, carbon trading, blockchain, sustainability, climate, eco, environment',
  authors: [{ name: 'EcoTrade Team' }],
  openGraph: {
    title: 'EcoTrade - The Future of Carbon Credit Trading',
    description: 'Trade verified carbon credits with blockchain-powered transparency',
    url: 'https://ecotrade.io',
    siteName: 'EcoTrade',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EcoTrade - Carbon Credit Trading Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoTrade - The Future of Carbon Credit Trading',
    description: 'Trade verified carbon credits with blockchain-powered transparency',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#10b981" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ContextProvider cookies={cookies}>
            <AppProvider>
              <MQTTProvider>
                <AuthenticationHandler />
                <ToastProvider>
                  <Navigation />
                  <main className="min-h-screen">
                    {children}
                  </main>
                </ToastProvider>
              </MQTTProvider>
            </AppProvider>
          </ContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
