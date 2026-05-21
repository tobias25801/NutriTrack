import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  email: string
  username: string
  weight?: number
  height?: number
  age?: number
  goal?: string
  activityLevel?: string
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  dailyWater: number
  avatarUrl?: string
  xp: number
  level: number
  streak: number
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  setAuth: (accessToken: string, refreshToken: string, user: User) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (accessToken, refreshToken, user) => {
    await AsyncStorage.multiSet([
      ['nt_access_token', accessToken],
      ['nt_refresh_token', refreshToken],
      ['nt_user', JSON.stringify(user)],
    ])
    set({ accessToken, refreshToken, user, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['nt_access_token', 'nt_refresh_token', 'nt_user'])
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false })
  },

  hydrate: async () => {
    try {
      const [[, token], [, refreshToken], [, userStr]] = await AsyncStorage.multiGet([
        'nt_access_token', 'nt_refresh_token', 'nt_user',
      ])
      if (token && userStr) {
        set({
          accessToken: token,
          refreshToken,
          user: JSON.parse(userStr),
          isAuthenticated: true,
          isHydrated: true,
        })
      } else {
        set({ isHydrated: true })
      }
    } catch {
      set({ isHydrated: true })
    }
  },

  updateUser: (partial) => {
    const current = get().user
    if (current) {
      const updated = { ...current, ...partial }
      set({ user: updated })
      AsyncStorage.setItem('nt_user', JSON.stringify(updated))
    }
  },
}))
