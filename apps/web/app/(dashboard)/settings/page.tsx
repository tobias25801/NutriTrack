'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Save, User, Target, Bell, Database } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { calculateBMR, calculateTDEE, getGoalCalories } from '@/lib/utils'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    username: user?.username || '',
    age: user?.age?.toString() || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    gender: user?.gender || 'male',
    units: user?.units || 'metric',
  })

  const [goals, setGoals] = useState({
    goal: user?.goal || 'MAINTAIN',
    activityLevel: user?.activityLevel || 'MODERATE',
    dailyCalories: user?.dailyCalories?.toString() || '2000',
    dailyProtein: user?.dailyProtein?.toString() || '150',
    dailyCarbs: user?.dailyCarbs?.toString() || '200',
    dailyFat: user?.dailyFat?.toString() || '67',
    dailyWater: user?.dailyWater?.toString() || '2000',
    dailySteps: user?.dailySteps?.toString() || '10000',
  })

  const updateProfile = useMutation({
    mutationFn: () =>
      api.put('/auth/me', {
        username: profile.username,
        age: profile.age ? parseInt(profile.age) : undefined,
        height: profile.height ? parseFloat(profile.height) : undefined,
        weight: profile.weight ? parseFloat(profile.weight) : undefined,
        gender: profile.gender,
        units: profile.units,
      }),
    onSuccess: (res) => {
      setUser(res.data.user)
      toast.success('Profile updated! ✓')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  })

  const updateGoals = useMutation({
    mutationFn: () =>
      api.put('/auth/me', {
        goal: goals.goal,
        activityLevel: goals.activityLevel,
        dailyCalories: parseInt(goals.dailyCalories),
        dailyProtein: parseInt(goals.dailyProtein),
        dailyCarbs: parseInt(goals.dailyCarbs),
        dailyFat: parseInt(goals.dailyFat),
        dailyWater: parseInt(goals.dailyWater),
        dailySteps: parseInt(goals.dailySteps),
      }),
    onSuccess: (res) => {
      setUser(res.data.user)
      toast.success('Goals updated! ✓')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  })

  const autoCalculate = () => {
    if (!profile.age || !profile.height || !profile.weight) {
      toast.error('Please fill in age, height, and weight first')
      return
    }
    const bmr = calculateBMR(
      parseFloat(profile.weight),
      parseFloat(profile.height),
      parseInt(profile.age),
      profile.gender
    )
    const tdee = calculateTDEE(bmr, goals.activityLevel)
    const calories = getGoalCalories(tdee, goals.goal)
    const protein = Math.round(parseFloat(profile.weight) * 2.2)
    const fats = Math.round((calories * 0.3) / 9)
    const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)

    setGoals((prev) => ({
      ...prev,
      dailyCalories: calories.toString(),
      dailyProtein: protein.toString(),
      dailyCarbs: carbs.toString(),
      dailyFat: fats.toString(),
    }))

    toast.success('Goals calculated based on your stats!')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'goals', label: 'Nutrition Goals', icon: Target },
    { id: 'account', label: 'Account', icon: Database },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-nt-text-secondary text-sm">Manage your profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-nt-card rounded-xl p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <h2 className="font-semibold">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Username', key: 'username', placeholder: 'cooluser123' },
              { label: 'Age', key: 'age', placeholder: '25', type: 'number' },
              { label: 'Height (cm)', key: 'height', placeholder: '175', type: 'number' },
              { label: 'Weight (kg)', key: 'weight', placeholder: '75', type: 'number' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-sm text-nt-text-secondary mb-1.5 block">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={(profile as any)[field.key]}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Units</label>
              <select
                value={profile.units}
                onChange={(e) => setProfile({ ...profile, units: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, in)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </motion.div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Nutrition Goals</h2>
            <button
              onClick={autoCalculate}
              className="text-sm text-nt-accent hover:text-nt-accent-hover transition-colors"
            >
              Auto-calculate →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Goal</label>
              <select
                value={goals.goal}
                onChange={(e) => setGoals({ ...goals, goal: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
              >
                <option value="LOSE_WEIGHT">Lose Weight</option>
                <option value="MAINTAIN">Maintain</option>
                <option value="GAIN_MUSCLE">Gain Muscle</option>
                <option value="IMPROVE_HEALTH">Improve Health</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Activity Level</label>
              <select
                value={goals.activityLevel}
                onChange={(e) => setGoals({ ...goals, activityLevel: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
              >
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHT">Light</option>
                <option value="MODERATE">Moderate</option>
                <option value="ACTIVE">Active</option>
                <option value="VERY_ACTIVE">Very Active</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Daily Calories (kcal)', key: 'dailyCalories', color: 'text-purple-400' },
              { label: 'Daily Protein (g)', key: 'dailyProtein', color: 'text-blue-400' },
              { label: 'Daily Carbs (g)', key: 'dailyCarbs', color: 'text-amber-400' },
              { label: 'Daily Fats (g)', key: 'dailyFat', color: 'text-red-400' },
              { label: 'Daily Water (ml)', key: 'dailyWater', color: 'text-cyan-400' },
              { label: 'Daily Steps', key: 'dailySteps', color: 'text-green-400' },
            ].map((field) => (
              <div key={field.key}>
                <label className={`text-sm mb-1.5 block ${field.color}`}>{field.label}</label>
                <input
                  type="number"
                  value={(goals as any)[field.key]}
                  onChange={(e) => setGoals({ ...goals, [field.key]: e.target.value })}
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => updateGoals.mutate()}
            disabled={updateGoals.isPending}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            {updateGoals.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Goals
          </button>
        </motion.div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <h2 className="font-semibold">Account Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Email', value: user?.email },
              { label: 'Username', value: user?.username },
              { label: 'Level', value: `Level ${user?.level}` },
              { label: 'Total XP', value: `${user?.xp?.toLocaleString()} XP` },
              { label: 'Current Streak', value: `${user?.streak} days 🔥` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-nt-border/50">
                <span className="text-sm text-nt-text-secondary">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <button
              onClick={async () => {
                try {
                  const response = await api.get('/meals/nutrition/summary?startDate=2020-01-01')
                  const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'nutritrack-data.json'
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Data exported!')
                } catch {
                  toast.error('Export failed')
                }
              }}
              className="text-sm text-nt-accent hover:underline"
            >
              Export my data →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
