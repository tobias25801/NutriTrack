export type Goal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE' | 'IMPROVE_HEALTH'
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface User {
  id: string
  email: string
  username: string
  weight?: number
  height?: number
  age?: number
  gender?: string
  goal: Goal
  activityLevel: ActivityLevel
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  dailyWater: number
  dailySteps: number
  avatarUrl?: string
  xp: number
  level: number
  streak: number
  units: string
  timezone: string
  notifications: boolean
  theme: string
  createdAt: string
  updatedAt: string
}

export interface Food {
  id: string
  name: string
  brand?: string
  barcode?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  sugar?: number
  sodium?: number
  saturatedFat?: number
  servingSize: number
  servingUnit: string
  imageUrl?: string
  isVerified: boolean
  isPublic: boolean
  createdById?: string
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
}

export interface MealEntry {
  id: string
  userId: string
  foodId: string
  grams: number
  mealType: MealType
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
  food?: Food
  createdAt: string
}

export interface WeightEntry {
  id: string
  userId: string
  weight: number
  bodyFat?: number
  muscleMass?: number
  note?: string
  date: string
}

export interface WaterEntry {
  id: string
  userId: string
  amount: number
  date: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp: number
  category: string
  unlocked?: boolean
  unlockedAt?: string
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}
