'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Flame, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordChecks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'Contains a number or uppercase', pass: /[A-Z0-9]/.test(form.password) },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.accessToken, data.refreshToken, data.user)
      toast.success('Account created! Welcome to NutriTrack 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    'No credit card required',
    'All features free forever',
    'AI-powered meal analysis',
    'No ads, ever',
  ]

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
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-nt-text-secondary">Start tracking in under 30 seconds</p>
        </div>

        <div className="glass-card p-8">
          {/* Perks */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-1.5 text-xs text-nt-text-secondary">
                <Check className="w-3.5 h-3.5 text-nt-success flex-shrink-0" />
                {perk}
              </div>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nt-text-secondary mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-3 text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nt-text-secondary mb-2">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="cooluser123"
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                maxLength={20}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-3 text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nt-text-secondary mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-1.5 text-xs ${check.pass ? 'text-nt-success' : 'text-nt-text-muted'}`}
                    >
                      <Check className={`w-3 h-3 ${check.pass ? 'opacity-100' : 'opacity-30'}`} />
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordChecks.every((c) => c.pass)}
              className="w-full bg-nt-accent hover:bg-nt-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-nt-accent/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-nt-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-nt-accent hover:text-nt-accent-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
