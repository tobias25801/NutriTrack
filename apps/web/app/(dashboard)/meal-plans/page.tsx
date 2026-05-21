'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, ChevronDown, ChevronUp, Loader2, Plus, Sparkles, Utensils } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

const GOALS = [
  { value: 'MAINTAIN', label: 'Maintain Weight' },
  { value: 'LOSE_WEIGHT', label: 'Lose Weight' },
  { value: 'GAIN_MUSCLE', label: 'Gain Muscle (Bulk)' },
  { value: 'IMPROVE_HEALTH', label: 'Improve Health' },
]

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary (desk job)' },
  { value: 'LIGHT', label: 'Light (1-3x/week)' },
  { value: 'MODERATE', label: 'Moderate (3-5x/week)' },
  { value: 'ACTIVE', label: 'Active (6-7x/week)' },
  { value: 'VERY_ACTIVE', label: 'Very Active (2x/day)' },
]

export default function MealPlansPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showGenerator, setShowGenerator] = useState(false)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [form, setForm] = useState({
    age: user?.age?.toString() || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    gender: user?.gender || 'male',
    goal: user?.goal || 'MAINTAIN',
    activityLevel: user?.activityLevel || 'MODERATE',
    dietaryPreferences: [] as string[],
    days: '7',
  })

  const generatePlan = useMutation({
    mutationFn: () =>
      api.post('/ai/generate-plan', {
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        gender: form.gender,
        goal: form.goal,
        activityLevel: form.activityLevel,
        dietaryPreferences: form.dietaryPreferences,
        days: parseInt(form.days),
      }).then((r) => r.data),
    onSuccess: (data) => {
      setGeneratedPlan(data)
      setShowGenerator(false)
      toast.success('Meal plan generated! 🎉')
    },
    onError: (err: any) => {
      if (err.response?.status === 503) {
        toast.error('AI service not configured. Add OPENAI_API_KEY to enable.')
      } else {
        toast.error('Failed to generate plan')
      }
    },
  })

  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'high-protein', 'low-carb', 'budget-friendly']

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Plans</h1>
          <p className="text-nt-text-secondary text-sm">AI-generated personalized meal plans</p>
        </div>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </button>
      </div>

      {/* Generator Form */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Bot className="w-5 h-5 text-nt-accent" />
                <h2 className="font-semibold">AI Meal Plan Generator</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Age', key: 'age', type: 'number', placeholder: '25' },
                  { label: 'Height (cm)', key: 'height', type: 'number', placeholder: '175' },
                  { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: '75' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm text-nt-text-secondary mb-1 block">{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Goal</label>
                  <select
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
                  >
                    {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Activity Level</label>
                  <select
                    value={form.activityLevel}
                    onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
                  >
                    {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-sm text-nt-text-secondary mb-2 block">Dietary Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        dietaryPreferences: prev.dietaryPreferences.includes(opt)
                          ? prev.dietaryPreferences.filter((o) => o !== opt)
                          : [...prev.dietaryPreferences, opt],
                      }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        form.dietaryPreferences.includes(opt)
                          ? 'bg-nt-accent border-nt-accent text-white'
                          : 'border-nt-border text-nt-text-secondary hover:border-nt-accent/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Number of Days</label>
                  <select
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                    className="bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent"
                  >
                    {[3, 5, 7, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <button
                  onClick={() => generatePlan.mutate()}
                  disabled={generatePlan.isPending || !form.age || !form.height || !form.weight}
                  className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 mt-4"
                >
                  {generatePlan.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Plan */}
      {generatedPlan && (
        <div className="space-y-4">
          {/* Plan Header */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">{generatedPlan.name}</h2>
                <p className="text-nt-text-secondary text-sm">{generatedPlan.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Calories', value: generatedPlan.targetCalories, unit: 'kcal', color: 'text-purple-400' },
                { label: 'Protein', value: generatedPlan.targetProtein, unit: 'g', color: 'text-blue-400' },
                { label: 'Carbs', value: generatedPlan.targetCarbs, unit: 'g', color: 'text-amber-400' },
                { label: 'Fat', value: generatedPlan.targetFat, unit: 'g', color: 'text-red-400' },
              ].map((m) => (
                <div key={m.label} className="text-center p-3 bg-nt-bg rounded-xl">
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}{m.unit}</div>
                  <div className="text-xs text-nt-text-muted">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Days */}
          {generatedPlan.days?.map((day: any) => (
            <div key={day.dayNumber} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                className="w-full flex items-center justify-between p-5 hover:bg-nt-card-hover/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-nt-accent/20 flex items-center justify-center text-sm font-bold text-nt-accent">
                    {day.dayNumber}
                  </div>
                  <div>
                    <div className="font-semibold">{day.dayName}</div>
                    <div className="text-xs text-nt-text-secondary">{day.totalCalories} kcal</div>
                  </div>
                </div>
                {expandedDay === day.dayNumber ? <ChevronUp className="w-4 h-4 text-nt-text-muted" /> : <ChevronDown className="w-4 h-4 text-nt-text-muted" />}
              </button>

              <AnimatePresence>
                {expandedDay === day.dayNumber && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-nt-border">
                      {day.meals?.map((meal: any, mi: number) => (
                        <div key={mi} className="mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Utensils className="w-4 h-4 text-nt-accent" />
                            <span className="font-medium text-sm">{meal.name}</span>
                            <span className="text-xs text-nt-text-muted">{meal.time}</span>
                            <span className="ml-auto text-sm text-nt-text-secondary">{meal.totalCalories} kcal</span>
                          </div>
                          <div className="space-y-2 pl-6">
                            {meal.foods?.map((food: any, fi: number) => (
                              <div key={fi} className="flex justify-between text-sm py-2 px-3 bg-nt-bg rounded-lg">
                                <span className="text-nt-text-secondary">{food.name} <span className="text-nt-text-muted">({food.grams}g)</span></span>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-purple-400">{food.calories}kcal</span>
                                  <span className="text-blue-400">P:{food.protein}g</span>
                                  <span className="text-amber-400">C:{food.carbs}g</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Tips & Shopping */}
          {generatedPlan.tips?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-nt-accent" /> Tips
              </h3>
              <ul className="space-y-2">
                {generatedPlan.tips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-nt-text-secondary flex items-start gap-2">
                    <span className="text-nt-accent">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!generatedPlan && !showGenerator && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold mb-2">No Meal Plans Yet</h2>
          <p className="text-nt-text-secondary mb-6">Generate a personalized meal plan using AI</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="inline-flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate Meal Plan
          </button>
        </div>
      )}
    </div>
  )
}
