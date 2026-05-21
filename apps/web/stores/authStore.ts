import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  username: string
  weight?: number
  height?: number
  age?: number
  gender?: string
  goal?: string
  activityLevel?: string
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
  units?: string
  theme?: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
  setUser: (user: Partial<User>) => void
  logout: () => void
  updateAccessToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user, isAuthenticated: true })
      },

      setUser: (partial) => {
        const current = get().user
        if (current) {
          set({ user: { ...current, ...partial } })
        }
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false })
      },

      updateAccessToken: (token) => {
        set({ accessToken: token })
      },
    }),
    {
      name: 'nutritrack-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
