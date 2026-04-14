import type { Metadata } from 'next'
import { Inter, Homemade_Apple } from 'next/font/google'
import { Agentation } from 'agentation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const signatureFont = Homemade_Apple({ subsets: ['latin'], weight: ['400'], variable: '--font-signature' })

export const metadata: Metadata = {
  title: 'Ramp Card Playground',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${signatureFont.variable} overflow-hidden`} style={{ background: '#f5f5f5' }}>
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
