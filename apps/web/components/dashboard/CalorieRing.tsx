'use client'

import { motion } from 'framer-motion'
import { formatCalories, getPercentage } from '@/lib/utils'

interface CalorieRingProps {
  consumed: number
  goal: number
  burned?: number
}

export function CalorieRing({ consumed, goal, burned = 0 }: CalorieRingProps) {
  const remaining = Math.max(0, goal - consumed)
  const percent = getPercentage(consumed, goal)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * Math.min(percent, 100)) / 100

  const isOver = consumed > goal

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <h3 className="text-sm font-medium text-nt-text-secondary mb-4 self-start">Calories Today</h3>

      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
          {/* Track */}
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
          {/* Progress */}
          <motion.circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={isOver ? '#ef4444' : 'url(#calGradient)'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c4dff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="text-3xl font-bold leading-none">{formatCalories(consumed)}</div>
            <div className="text-xs text-nt-text-secondary mt-0.5">
              of {formatCalories(goal)}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 w-full">
        <div className="text-center p-2 bg-nt-bg rounded-lg">
          <div className="text-lg font-semibold text-green-400">{formatCalories(remaining)}</div>
          <div className="text-xs text-nt-text-muted">Remaining</div>
        </div>
        <div className="text-center p-2 bg-nt-bg rounded-lg">
          <div className="text-lg font-semibold text-nt-text-secondary">{percent}%</div>
          <div className="text-xs text-nt-text-muted">of Goal</div>
        </div>
      </div>

      {isOver && (
        <div className="mt-3 text-xs text-red-400 text-center">
          {formatCalories(consumed - goal)} kcal over goal
        </div>
      )}
    </div>
  )
}
