'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api'

interface User {
  id: number
  email: string
  username: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // Set token in axios default headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      // OAuth2PasswordRequestForm expects form-urlencoded data
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const response = await apiClient.post('/auth/login', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem(TOKEN_KEY, access_token)

      // Set token in axios default headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      // Fetch user info
      const userResponse = await apiClient.get('/auth/me')
      setUser(userResponse.data)
      localStorage.setItem(USER_KEY, JSON.stringify(userResponse.data))
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Provide more specific error messages
      if (error.response) {
        // Server responded with error
        const detail = error.response.data?.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
        throw new Error(detail || 'Erreur de connexion')
      } else if (error.request) {
        // Request made but no response
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.')
      } else {
        // Error setting up request
        throw new Error(error.message || 'Erreur de connexion')
      }
    }
  }

  const register = async (email: string, username: string, password: string) => {
    let registrationSuccess = false
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        username,
        password,
      })

      registrationSuccess = true

      // After registration, automatically log in
      // Wait a bit to ensure the user is fully committed to the database
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        await login(username, password)
      } catch (loginError: any) {
        // If login fails after successful registration, try to get more details
        console.error('Login after registration failed:', loginError)
        console.error('Login error details:', loginError.response?.data)
        
        // If it's a credential error, the user might need to wait or there's a hash mismatch
        const errorDetail = loginError.response?.data?.detail || loginError.message
        if (errorDetail?.includes('Incorrect') || errorDetail?.includes('password')) {
          throw new Error('Registration successful but password verification failed. Please try logging in manually or contact support.')
        }
        
        throw new Error(`Registration successful but login failed: ${errorDetail || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response)
      
      // Handle different error formats
      let errorMessage = 'Registration failed'
      
      if (error.response) {
        // Server responded with error
        const detail = error.response.data?.detail
        if (Array.isArray(detail)) {
          // Validation errors from Pydantic
          errorMessage = detail.map((err: any) => {
            const field = err.loc?.join('.') || 'field'
            const msg = err.msg || 'Invalid value'
            return `${field}: ${msg}`
          }).join(', ')
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete apiClient.defaults.headers.common['Authorization']
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

