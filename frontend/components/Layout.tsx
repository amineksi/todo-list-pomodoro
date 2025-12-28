'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CheckSquare, BarChart3, LogOut, User } from 'lucide-react'
import TimerBar from './TimerBar'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Don't show nav on login/register pages
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  // Pages qui nécessitent une authentification
  const protectedPages = ['/dashboard', '/tasks']
  const isProtectedPage = protectedPages.includes(pathname)

  if (isAuthPage) {
    return <>{children}</>
  }

  // Si c'est la page d'accueil et que l'utilisateur n'est pas connecté, pas de nav sombre
  if (pathname === '/' && !isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-white">
                <span className="text-2xl">🍅</span>
                <span>Pomodoro Task Manager</span>
              </Link>
              <div className="flex space-x-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/dashboard'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <BarChart3 size={16} />
                        <span>Dashboard</span>
                      </div>
                    </Link>
                    <Link
                      href="/tasks"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/tasks'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckSquare size={16} />
                        <span>Tasks</span>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      Accueil
                    </Link>
                    <Link
                      href="/login"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            </div>
            {isAuthenticated && user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <User size={16} />
                  <span className="text-sm">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white">Chargement...</div>
          </div>
        ) : isProtectedPage && !isAuthenticated ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-white text-lg mb-4">Vous devez être connecté pour accéder au dashboard</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      {isAuthenticated && <TimerBar />}
    </div>
  )
}
