import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyAI — Learn Smarter',
  description: 'AI-powered study assistant with summaries, flashcards, quizzes, and more',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
