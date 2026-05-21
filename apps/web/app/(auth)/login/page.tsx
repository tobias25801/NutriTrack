'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Flame, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.accessToken, data.refreshToken, data.user)
      toast.success(`Welcome back, ${data.user.username}! 👋`)
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail('demo@nutritrack.app')
    setPassword('demo123456')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: 'demo@nutritrack.app',
        password: 'demo123456',
      })
      setAuth(data.accessToken, data.refreshToken, data.user)
      toast.success('Welcome to the demo! 🚀')
      router.push('/dashboard')
    } catch {
      toast.error('Demo login failed. Please try registering.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nt-bg flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-nt-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nt-accent to-purple-400 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">NutriTrack</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-nt-text-secondary">Sign in to continue your journey</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-nt-text-secondary mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-3 text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nt-text-secondary mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-3 text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent transition-colors pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-nt-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nt-accent hover:bg-nt-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-nt-accent/25 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign In
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-nt-border" />
            </div>
            <div className="relative flex justify-center text-xs text-nt-text-muted">
              <span className="bg-nt-card px-3">or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full border border-nt-border hover:border-nt-accent/50 text-nt-text-secondary hover:text-white py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-nt-card-hover"
          >
            Try Demo Account
          </button>

          <p className="text-center text-sm text-nt-text-secondary mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-nt-accent hover:text-nt-accent-hover font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
