'use client'

import { motion } from 'framer-motion'
import { getPercentage, getMacroBgColor, getMacroColor } from '@/lib/utils'

interface MacroCardProps {
  type: 'protein' | 'carbs' | 'fats'
  label: string
  value: number
  goal: number
  unit: string
}

const macroIcons = {
  protein: '🥩',
  carbs: '🌾',
  fats: '🥑',
}

const macroGradients = {
  protein: 'from-blue-600 to-blue-400',
  carbs: 'from-amber-600 to-amber-400',
  fats: 'from-red-600 to-red-400',
}

export function MacroCard({ type, label, value, goal, unit }: MacroCardProps) {
  const percent = getPercentage(value, goal)
  const isOver = value > goal

  return (
    <div className="glass-card p-5 hover:bg-nt-card-hover/80 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg">{macroIcons[type]}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOver ? 'bg-red-500/10 text-red-400' : 'bg-nt-bg text-nt-text-muted'}`}>
          {percent}%
        </span>
      </div>

      <div className="mb-1">
        <span className={`text-2xl font-bold ${getMacroColor(type)}`}>
          {Math.round(value * 10) / 10}
        </span>
        <span className="text-sm text-nt-text-muted ml-1">{unit}</span>
      </div>

      <div className="text-xs text-nt-text-secondary mb-3">
        {label} • Goal: {goal}{unit}
      </div>

      <div className="progress-bar">
        <motion.div
          className={`h-full bg-gradient-to-r ${macroGradients[type]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
