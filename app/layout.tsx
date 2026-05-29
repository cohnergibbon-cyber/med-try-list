import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Med Try List 🫒',
  description: 'Mediterranean restaurant tracker — Dallas & Austin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
