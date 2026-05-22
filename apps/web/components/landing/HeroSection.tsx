'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, ChevronRight, Dumbbell, Star, UtensilsCrossed, Zap } from 'lucide-react'

const stats = [
  { value: '2M+', label: 'Foods in Database' },
  { value: '100%', label: 'Free Features' },
  { value: 'AI', label: 'Powered Analysis' },
  { value: '0', label: 'Ads or Paywalls' },
]

const pillars = [
  { icon: UtensilsCrossed, label: 'Nutrition', color: 'text-nt-accent' },
  { icon: Dumbbell, label: 'Training', color: 'text-purple-400' },
  { icon: Brain, label: 'Mindset', color: 'text-violet-300' },
]

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,77,255,0.10) 0%, transparent 68%)' }}
        />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,77,255,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-nt-card border border-nt-accent/30 rounded-full px-4 py-1.5 text-sm text-nt-text-secondary mb-10"
        >
          <Star className="w-3.5 h-3.5 text-nt-accent" fill="currentColor" />
          <span>AI-Powered Nutrition Tracking</span>
          <span className="w-1.5 h-1.5 rounded-full bg-nt-accent animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black mb-6 leading-[1.05] tracking-tight"
        >
          Build Your Best
          <br />
          <span className="gradient-text">Physique</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-nt-text-secondary mb-5 max-w-2xl mx-auto leading-relaxed"
        >
          Nutrition, training and mindset.{' '}
          <span className="text-white font-medium">The 3 pillars of transformation.</span>
        </motion.p>

        {/* Pillar icons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-8 mb-6"
        >
          {pillars.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-nt-text-secondary">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Secondary text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="text-xs tracking-[0.25em] uppercase text-nt-text-muted font-semibold mb-12"
        >
          Track &nbsp;·&nbsp; Improve &nbsp;·&nbsp; Become
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{ boxShadow: '0 0 24px rgba(124,77,255,0.30)' }}
          >
            Start for Free
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-nt-border hover:border-nt-border-light text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:bg-nt-card"
          >
            <Zap className="w-5 h-5 text-nt-accent" />
            View Demo
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-5 transition-colors hover:border-nt-accent/30"
            >
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-xs text-nt-text-secondary">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Journey closer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-nt-border/50 pt-14"
        >
          <p className="text-2xl md:text-3xl font-bold mb-3 gradient-text">
            Your journey starts now.
          </p>
          <p className="text-sm text-nt-text-secondary max-w-sm mx-auto leading-relaxed">
            Every rep counts. Every meal matters. Every day is a chance to be better than yesterday.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
