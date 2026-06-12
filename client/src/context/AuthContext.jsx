import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize: Check if a user is already logged in via token
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('navguide_token')
      if (token) {
        try {
          const res = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          } else {
            localStorage.removeItem('navguide_token')
            setUser(null)
          }
        } catch (error) {
          console.error('Error loading current user from database:', error)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  // Action: Login
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.')
      }
      localStorage.setItem('navguide_token', data.token)
      setUser(data.user)
      return data.user
    } catch (error) {
      throw error
    }
  }

  // Action: Signup
  const signup = async (signupData) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          academicLevel: signupData.academicLevel,
          academicMarks: signupData.academicMarks,
          academicStream: signupData.academicStream,
          interests: signupData.interests || [],
          careerGoal: signupData.careerGoal || '',
          preferredCollegeType: signupData.preferredCollegeType,
          budget: signupData.budget,
          location: signupData.location
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed.')
      }
      localStorage.setItem('navguide_token', data.token)
      setUser(data.user)
      
      // Clear partial onboarding progress since they successfully created the account
      localStorage.removeItem('navguide_signup_progress')
      return data.user
    } catch (error) {
      throw error
    }
  }

  // Action: Update Profile
  const updateProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.')
      }
      setUser(data)
      return data
    } catch (error) {
      throw error
    }
  }

  // Action: Logout
  const logout = () => {
    localStorage.removeItem('navguide_token')
    setUser(null)
  }

  // Action: Save signup step progress
  const saveSignupProgress = (progress) => {
    try {
      localStorage.setItem('navguide_signup_progress', JSON.stringify(progress))
    } catch (e) {
      console.error('Error saving signup progress:', e)
    }
  }

  // Action: Get saved signup progress
  const getSignupProgress = () => {
    try {
      const data = localStorage.getItem('navguide_signup_progress')
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error getting signup progress:', e)
      return null
    }
  }

  // Action: Clear saved signup progress
  const clearSignupProgress = () => {
    localStorage.removeItem('navguide_signup_progress')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        updateProfile,
        logout,
        saveSignupProgress,
        getSignupProgress,
        clearSignupProgress
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


