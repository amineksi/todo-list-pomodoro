'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { BarChart3, CheckSquare, Clock, ArrowRight } from 'lucide-react'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  // Si l'utilisateur est authentifié, afficher le dashboard
  if (isAuthenticated) {
    return <Dashboard />
  }

  // Sinon, afficher la page d'accueil publique
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              🍅 Pomodoro Task Manager
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Boostez votre productivité avec la technique Pomodoro et la gestion de tâches
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Créer un compte
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Fonctionnalités
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <CheckSquare className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestion de Tâches
              </h3>
              <p className="text-gray-600">
                Créez, organisez et suivez vos tâches avec des priorités et des dates d&apos;échéance
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Clock className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Timer Pomodoro
              </h3>
              <p className="text-gray-600">
                Sessions de travail de 25 minutes avec pauses pour maximiser votre concentration
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <BarChart3 className="text-pink-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Statistiques
              </h3>
              <p className="text-gray-600">
                Suivez votre productivité avec des métriques détaillées et des tableaux de bord
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à améliorer votre productivité ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Créez un compte gratuit pour accéder au dashboard et commencer à suivre vos progrès
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Commencer maintenant
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    </div>
  )
}
