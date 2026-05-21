import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export interface JwtPayload {
  sub: string
  email: string
  username: string
  iat?: number
  exp?: number
}

export interface RegisterBody {
  email: string
  username: string
  password: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface GoogleLoginBody {
  idToken: string
}

export interface UpdateProfileBody {
  username?: string
  weight?: number
  height?: number
  age?: number
  gender?: string
  goal?: string
  activityLevel?: string
  dailyCalories?: number
  dailyProtein?: number
  dailyCarbs?: number
  dailyFat?: number
  dailyWater?: number
  dailySteps?: number
  units?: string
  timezone?: string
  notifications?: boolean
  theme?: string
}

export interface CreateFoodBody {
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
  servingSize?: number
  servingUnit?: string
  imageUrl?: string
  isPublic?: boolean
}

export interface LogMealBody {
  foodId: string
  grams: number
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  date?: string
}

export interface AddWeightBody {
  weight: number
  bodyFat?: number
  muscleMass?: number
  note?: string
  date?: string
}

export interface AddWaterBody {
  amount: number
  date?: string
}

export interface AddStepsBody {
  steps: number
  date?: string
}

export interface AnalyzeMealBody {
  imageBase64?: string
  imageUrl?: string
  description?: string
}

export interface GeneratePlanBody {
  age: number
  height: number
  weight: number
  gender: string
  goal: string
  activityLevel: string
  dietaryPreferences?: string[]
  allergies?: string[]
  budget?: string
  days?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatBody {
  messages: ChatMessage[]
  context?: {
    todayCalories?: number
    dailyGoal?: number
    weight?: number
    goal?: string
  }
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  water: number
  steps: number
}
