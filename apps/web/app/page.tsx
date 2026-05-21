'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Activity,
  Barcode,
  Brain,
  ChevronRight,
  Flame,
  Shield,
  Smartphone,
  Star,
  Trophy,
  Zap,
} from 'lucide-react'

const features = [
  {
    icon: <Flame className="w-6 h-6" />,
    title: 'Calorie & Macro Tracking',
    description: 'Log meals instantly with our massive food database. Track calories, protein, carbs, and fats with beautiful visual charts.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: <Barcode className="w-6 h-6" />,
    title: 'Barcode Scanner',
    description: 'Scan any product barcode and get instant nutritional info. Works with millions of products worldwide.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Meal Analyzer',
    description: 'Take a photo of any meal and our AI will identify the food, estimate portions, and calculate macros instantly.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: 'Smart Meal Plans',
    description: 'AI-generated personalized meal plans for your goals — bulk, cut, high-protein, low-carb, or budget-friendly.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Gamification',
    description: 'Earn XP, level up, maintain streaks, and unlock achievements. Stay motivated every single day.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '100% Free, No Ads',
    description: 'Every premium feature — AI analysis, advanced analytics, meal plans — completely free forever.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
]

const stats = [
  { value: '2M+', label: 'Foods in Database' },
  { value: '100%', label: 'Free Features' },
  { value: 'AI', label: 'Powered Analysis' },
  { value: '0', label: 'Ads or Paywalls' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nt-bg overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-nt-border/50 bg-nt-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nt-accent to-purple-400 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">NutriTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-nt-text-secondary hover:text-white transition-colors text-sm"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-nt-accent/25"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nt-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-nt-card border border-nt-accent/30 rounded-full px-4 py-1.5 text-sm text-nt-text-secondary mb-8">
              <Star className="w-3.5 h-3.5 text-nt-accent" fill="currentColor" />
              <span>The future of nutrition tracking is here</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Track Nutrition
              <br />
              <span className="gradient-text">Effortlessly</span>
            </h1>

            <p className="text-xl text-nt-text-secondary mb-10 max-w-2xl mx-auto">
              The most powerful calorie and nutrition tracker — completely free. AI meal analysis,
              smart meal plans, barcode scanning, and beautiful analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-nt-accent/30 hover:-translate-y-0.5"
              >
                Start for Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-nt-border hover:border-nt-border-light text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:bg-nt-card"
              >
                <Smartphone className="w-5 h-5" />
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-6">
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-nt-text-secondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-nt-border/50 bg-nt-card p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-nt-accent/5 to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Calorie Ring mockup */}
              <div className="glass-card p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="url(#gradient)" strokeWidth="10"
                      strokeDasharray="314" strokeDashoffset="94"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c4dff" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">1,640</span>
                    <span className="text-xs text-nt-text-secondary">/ 2,200 kcal</span>
                  </div>
                </div>
                <div className="text-sm text-nt-text-secondary">560 kcal remaining</div>
              </div>

              {/* Macros mockup */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-sm text-nt-text-secondary uppercase tracking-wider">Macros Today</h3>
                {[
                  { label: 'Protein', value: 142, goal: 165, color: 'bg-blue-500', pct: 86 },
                  { label: 'Carbs', value: 198, goal: 275, color: 'bg-amber-500', pct: 72 },
                  { label: 'Fats', value: 55, goal: 73, color: 'bg-red-500', pct: 75 },
                ].map((macro) => (
                  <div key={macro.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-nt-text-secondary">{macro.label}</span>
                      <span className="font-medium">{macro.value}g / {macro.goal}g</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`h-full ${macro.color} rounded-full`} style={{ width: `${macro.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Streak & Achievement mockup */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-nt-accent/10 rounded-xl border border-nt-accent/20">
                  <div className="text-3xl">🔥</div>
                  <div>
                    <div className="text-2xl font-bold">14</div>
                    <div className="text-xs text-nt-text-secondary">Day Streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <div className="text-3xl">⭐</div>
                  <div>
                    <div className="text-lg font-bold">Level 4</div>
                    <div className="text-xs text-nt-text-secondary">1,250 / 2,000 XP</div>
                  </div>
                </div>
                <div className="text-xs text-nt-text-secondary bg-nt-card-hover rounded-xl p-3 border border-nt-border">
                  💡 <span className="text-white">AI Tip:</span> Add more leafy greens to boost your fiber intake today!
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need,{' '}
              <span className="gradient-text">Forever Free</span>
            </h2>
            <p className="text-nt-text-secondary text-lg max-w-2xl mx-auto">
              No subscriptions, no paywalls, no ads. Every feature is available to everyone.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card-hover p-6"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-nt-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card p-12 accent-glow border-nt-accent/20"
          >
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl font-bold mb-4">Start Tracking Today</h2>
            <p className="text-nt-text-secondary mb-8">
              Join thousands of users who are hitting their nutrition goals with NutriTrack.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-nt-accent/30 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              Get Started — It's Free
            </Link>
            <p className="text-xs text-nt-text-muted mt-4">No credit card required • No ads • No paywalls</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-nt-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nt-accent to-purple-400 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">NutriTrack</span>
          </div>
          <p className="text-sm text-nt-text-muted">© 2024 NutriTrack. Free forever.</p>
        </div>
      </footer>
    </div>
  )
}
