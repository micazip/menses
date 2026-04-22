import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '우리 가족 생리 달력',
  description: '가족 생리 주기 관리',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-pink-50 min-h-screen">{children}</body>
    </html>
  )
}
