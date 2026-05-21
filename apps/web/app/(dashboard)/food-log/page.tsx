'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { formatCalories, formatMacro } from '@/lib/utils'
import { toast } from 'sonner'
import { FoodSearch } from '@/components/food/FoodSearch'

const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const
const mealEmojis = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙', SNACK: '🍎' }

export default function FoodLogPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(new Date())
  const [addingTo, setAddingTo] = useState<string | null>(null)

  const dateStr = date.toISOString().split('T')[0]
  const isToday = dateStr === new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['meals', dateStr],
    queryFn: () => api.get(`/meals?date=${dateStr}`).then((r) => r.data),
  })

  const deleteEntry = useMutation({
    mutationFn: (id: string) => api.delete(`/meals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success('Entry removed')
    },
  })

  const addMeal = useMutation({
    mutationFn: ({ foodId, grams, mealType }: { foodId: string; grams: number; mealType: string }) =>
      api.post('/meals', { foodId, grams, mealType, date: dateStr }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      setAddingTo(null)
      toast.success('Food logged! 🎉')
    },
    onError: () => toast.error('Failed to log food'),
  })

  const navigateDate = (dir: -1 | 1) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + dir)
    setDate(newDate)
  }

  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }
  const grouped = data?.grouped || {}

  const formatDateLabel = (d: Date) => {
    if (d.toDateString() === new Date().toDateString()) return 'Today'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Date Navigator */}
      <div className="glass-card p-4 flex items-center justify-between">
        <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-nt-card-hover rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-semibold">{formatDateLabel(date)}</div>
          <div className="text-sm text-nt-text-secondary">
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="p-2 hover:bg-nt-card-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Summary */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-nt-text-secondary mb-4 uppercase tracking-wider">Daily Totals</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Calories', value: formatCalories(totals.calories), goal: user?.dailyCalories, unit: 'kcal', color: 'text-purple-400' },
            { label: 'Protein', value: `${Math.round(totals.protein)}g`, goal: user?.dailyProtein, unit: 'g', color: 'text-blue-400' },
            { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, goal: user?.dailyCarbs, unit: 'g', color: 'text-amber-400' },
            { label: 'Fats', value: `${Math.round(totals.fats)}g`, goal: user?.dailyFat, unit: 'g', color: 'text-red-400' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-nt-text-muted mt-0.5">{item.label}</div>
              {item.goal && (
                <div className="text-xs text-nt-text-muted">/ {item.goal}{item.unit}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Meal Sections */}
      {mealTypes.map((mealType) => {
        const entries = grouped[mealType] || []
        const mealCalories = entries.reduce((acc: number, e: any) => acc + e.calories, 0)

        return (
          <div key={mealType} className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-nt-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">{mealEmojis[mealType]}</span>
                <div>
                  <div className="font-semibold capitalize">{mealType.toLowerCase()}</div>
                  <div className="text-xs text-nt-text-secondary">{Math.round(mealCalories)} kcal</div>
                </div>
              </div>
              <button
                onClick={() => setAddingTo(addingTo === mealType ? null : mealType)}
                className="flex items-center gap-1.5 text-sm text-nt-accent hover:text-nt-accent-hover transition-colors px-3 py-1.5 rounded-lg hover:bg-nt-accent/10"
              >
                <Plus className="w-4 h-4" />
                Add Food
              </button>
            </div>

            {/* Food Search Panel */}
            <AnimatePresence>
              {addingTo === mealType && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-nt-border overflow-hidden"
                >
                  <div className="p-4">
                    <FoodSearch
                      onSelect={(food, grams) => {
                        addMeal.mutate({ foodId: food.id, grams, mealType })
                      }}
                      isLoading={addMeal.isPending}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entries */}
            <div className="divide-y divide-nt-border/50">
              {entries.length === 0 ? (
                <div className="p-4 text-center text-sm text-nt-text-muted">No foods logged</div>
              ) : (
                entries.map((entry: any) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 hover:bg-nt-card-hover/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{entry.food?.name || entry.user?.name}</div>
                      <div className="text-xs text-nt-text-secondary">
                        {entry.grams}g • P: {Math.round(entry.protein)}g • C: {Math.round(entry.carbs)}g • F: {Math.round(entry.fats)}g
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-sm">{Math.round(entry.calories)} kcal</div>
                      </div>
                      <button
                        onClick={() => deleteEntry.mutate(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-nt-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
