'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Droplets, Footprints, Plus, Sparkles, Target, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { CalorieRing } from '@/components/dashboard/CalorieRing'
import { MacroCard } from '@/components/dashboard/MacroCard'
import { WaterTracker } from '@/components/dashboard/WaterTracker'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'
import { AITipCard } from '@/components/dashboard/AITipCard'
import { formatCalories, getPercentage } from '@/lib/utils'
import Link from 'next/link'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: todayData } = useQuery({
    queryKey: ['meals', 'today'],
    queryFn: () => api.get('/meals').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: waterData } = useQuery({
    queryKey: ['water', 'today'],
    queryFn: () => api.get('/water/today').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: weightData } = useQuery({
    queryKey: ['weight'],
    queryFn: () => api.get('/weight?limit=7').then((r) => r.data),
  })

  const { data: achievementData } = useQuery({
    queryKey: ['achievements', 'progress'],
    queryFn: () => api.get('/achievements/progress').then((r) => r.data),
  })

  const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }
  const dailyGoal = user?.dailyCalories || 2000
  const waterTotal = waterData?.total || 0
  const waterGoal = waterData?.goal || user?.dailyWater || 2000

  const macros = [
    {
      type: 'protein' as const,
      label: 'Protein',
      value: totals.protein,
      goal: user?.dailyProtein || 150,
      unit: 'g',
    },
    {
      type: 'carbs' as const,
      label: 'Carbs',
      value: totals.carbs,
      goal: user?.dailyCarbs || 200,
      unit: 'g',
    },
    {
      type: 'fats' as const,
      label: 'Fats',
      value: totals.fats,
      goal: user?.dailyFat || 67,
      unit: 'g',
    },
  ]

  const recentEntries = todayData?.entries?.slice(-3).reverse() || []

  return (
    <div className="space-y-6">
      {/* Top row: Calorie ring + Macros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Calorie Ring */}
        <motion.div {...fadeUp} transition={{ delay: 0 }} className="lg:col-span-1">
          <CalorieRing
            consumed={totals.calories}
            goal={dailyGoal}
            burned={0}
          />
        </motion.div>

        {/* Macros */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="lg:col-span-3 grid grid-cols-3 gap-4">
          {macros.map((macro, i) => (
            <motion.div key={macro.type} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <MacroCard {...macro} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Middle row: Streak, Water, Weight, Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Streak */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-nt-text-secondary font-medium">Current Streak</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-4xl font-bold mb-1">{user?.streak || 0}</div>
          <div className="text-sm text-nt-text-secondary">days in a row</div>
          {user?.streak && user.streak > 0 && (
            <div className="mt-3 text-xs text-nt-accent">Keep it up! 💪</div>
          )}
        </motion.div>

        {/* Water */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <WaterTracker current={waterTotal} goal={waterGoal} />
        </motion.div>

        {/* Weight */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-nt-text-secondary font-medium">Current Weight</span>
            <TrendingUp className="w-4 h-4 text-nt-text-muted" />
          </div>
          {user?.weight ? (
            <>
              <div className="text-4xl font-bold mb-1">
                {user.weight}
                <span className="text-lg font-normal text-nt-text-secondary ml-1">kg</span>
              </div>
              {weightData?.stats?.change !== undefined && (
                <div className={`text-sm ${weightData.stats.change <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {weightData.stats.change > 0 ? '+' : ''}{weightData.stats.change.toFixed(1)} kg this period
                </div>
              )}
            </>
          ) : (
            <Link href="/weight-tracking" className="text-sm text-nt-accent hover:underline">
              Log your weight →
            </Link>
          )}
        </motion.div>

        {/* Level / XP */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-nt-text-secondary font-medium">Progress</span>
            <span className="text-lg">⭐</span>
          </div>
          <div className="text-4xl font-bold mb-1">
            Lv.{user?.level || 1}
          </div>
          <div className="text-sm text-nt-text-secondary mb-3">
            {achievementData?.xpProgress || 0} / {achievementData?.xpNeeded || 500} XP
          </div>
          <div className="progress-bar">
            <motion.div
              className="h-full bg-gradient-to-r from-nt-accent to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${achievementData?.progressPercent || 0}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      </div>

      {/* AI Tip + Recent Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AI Tip */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="lg:col-span-1">
          <AITipCard />
        </motion.div>

        {/* Recent Meals */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }} className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Today's Meals</h3>
            <Link
              href="/food-log"
              className="flex items-center gap-1.5 text-sm text-nt-accent hover:text-nt-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Food
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-nt-text-secondary text-sm">No meals logged today</p>
              <Link href="/food-log" className="text-nt-accent text-sm hover:underline mt-1 block">
                Log your first meal →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-nt-bg rounded-xl border border-nt-border">
                  <div>
                    <div className="font-medium text-sm">{entry.food?.name || 'Unknown food'}</div>
                    <div className="text-xs text-nt-text-secondary capitalize">
                      {entry.mealType.toLowerCase()} • {entry.grams}g
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{Math.round(entry.calories)} kcal</div>
                    <div className="text-xs text-nt-text-muted">
                      P: {Math.round(entry.protein)}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
        <WeeklyChart />
      </motion.div>
    </div>
  )
}
