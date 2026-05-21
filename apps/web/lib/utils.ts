import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString()
}

export function formatMacro(value: number): string {
  return Math.round(value * 10) / 10 + 'g'
}

export function getPercentage(value: number, goal: number): number {
  if (goal === 0) return 0
  return Math.min(100, Math.round((value / goal) * 100))
}

export function getMacroColor(type: 'protein' | 'carbs' | 'fats' | 'calories'): string {
  const colors = {
    protein: 'text-blue-400',
    carbs: 'text-amber-400',
    fats: 'text-red-400',
    calories: 'text-purple-400',
  }
  return colors[type]
}

export function getMacroBgColor(type: 'protein' | 'carbs' | 'fats' | 'calories'): string {
  const colors = {
    protein: 'bg-blue-500',
    carbs: 'bg-amber-500',
    fats: 'bg-red-500',
    calories: 'bg-nt-accent',
  }
  return colors[type]
}

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  }
  return Math.round(bmr * (multipliers[activityLevel] || 1.55))
}

export function getGoalCalories(tdee: number, goal: string): number {
  const adjustments: Record<string, number> = {
    LOSE_WEIGHT: -500,
    MAINTAIN: 0,
    GAIN_MUSCLE: 300,
    IMPROVE_HEALTH: -200,
  }
  return tdee + (adjustments[goal] || 0)
}

export function getLevelLabel(level: number): string {
  if (level < 3) return 'Beginner'
  if (level < 6) return 'Tracker'
  if (level < 10) return 'Pro'
  if (level < 20) return 'Elite'
  return 'Legend'
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function getDayName(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
