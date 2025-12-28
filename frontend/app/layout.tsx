import type { Metadata } from 'next'
import './globals.css'
import Layout from '@/components/Layout'
import { PomodoroProvider } from '@/contexts/PomodoroContext'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: '🍅 Pomodoro Task Manager',
  description: 'A productivity app combining task management with Pomodoro technique',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <PomodoroProvider>
            <Layout>{children}</Layout>
          </PomodoroProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
