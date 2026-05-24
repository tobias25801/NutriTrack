'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, CheckCircle2, ChevronDown, ChevronUp, Loader2, Play,
  Plus, Save, Sparkles, Trash2, Utensils,
} from 'lucide-react'
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

const dietaryOptions = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'keto', 'paleo', 'high-protein', 'low-carb', 'budget-friendly',
]

type Tab = 'saved' | 'generate'

export default function MealPlansPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('saved')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [loggingDay, setLoggingDay] = useState<string | null>(null)
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

  const { data: savedPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: () => api.get('/meal-plans').then((r) => r.data),
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

  const savePlan = useMutation({
    mutationFn: (plan: any) => api.post('/meal-plans', plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
      setGeneratedPlan(null)
      setActiveTab('saved')
      toast.success('Plan saved and activated! ✓')
    },
    onError: () => toast.error('Failed to save plan'),
  })

  const activatePlan = useMutation({
    mutationFn: (id: string) => api.put(`/meal-plans/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
      toast.success('Plan activated!')
    },
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/meal-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
      toast.success('Plan deleted')
    },
  })

  const logDay = useMutation({
    mutationFn: ({ planId, dayNumber }: { planId: string; dayNumber: number }) =>
      api.post(`/meal-plans/${planId}/days/${dayNumber}/log`, {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      setLoggingDay(null)
      toast.success(`${res.data.logged} meals logged to today's food diary! 🍽️`)
    },
    onError: () => toast.error('Failed to log meals'),
  })

  const handleSaveGenerated = () => {
    if (!generatedPlan) return
    // Map AI plan structure to API format
    const payload = {
      name: generatedPlan.name,
      description: generatedPlan.description,
      targetCalories: generatedPlan.targetCalories,
      targetProtein: generatedPlan.targetProtein,
      targetCarbs: generatedPlan.targetCarbs,
      targetFat: generatedPlan.targetFat,
      days: (generatedPlan.days || []).map((day: any) => ({
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        meals: (day.meals || []).map((meal: any) => ({
          name: meal.name,
          mealType: meal.mealType || 'BREAKFAST',
          time: meal.time,
          foods: (meal.foods || []).map((f: any) => ({
            name: f.name,
            grams: f.grams || 100,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats || f.fat || 0,
          })),
        })),
      })),
    }
    savePlan.mutate(payload)
  }

  const plans: any[] = savedPlans?.plans || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Plans</h1>
          <p className="text-nt-text-secondary text-sm">AI-generated personalized meal plans</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('generate'); setGeneratedPlan(null) }}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-nt-card rounded-xl p-1 gap-1 w-fit">
        {(['saved', 'generate'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'}`}
          >
            {t === 'saved' ? 'Saved Plans' : 'Generate New'}
          </button>
        ))}
      </div>

      {/* Saved Plans Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {loadingPlans ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-nt-accent" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-xl font-semibold mb-2">No Saved Plans</h2>
              <p className="text-nt-text-secondary mb-6">Generate and save your first meal plan using AI</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="inline-flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </button>
            </div>
          ) : (
            plans.map((plan: any) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expandedDay={expandedDay}
                setExpandedDay={setExpandedDay}
                loggingDay={loggingDay}
                setLoggingDay={setLoggingDay}
                onActivate={() => activatePlan.mutate(plan.id)}
                onDelete={() => deletePlan.mutate(plan.id)}
                onLogDay={(dayNumber) => logDay.mutate({ planId: plan.id, dayNumber })}
                isActivating={activatePlan.isPending}
                isDeleting={deletePlan.isPending}
                isLogging={logDay.isPending}
              />
            ))
          )}
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-5">
          {!generatedPlan ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Bot className="w-5 h-5 text-nt-accent" />
                <h2 className="font-semibold">AI Meal Plan Generator</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Age', key: 'age', placeholder: '25' },
                  { label: 'Height (cm)', key: 'height', placeholder: '175' },
                  { label: 'Weight (kg)', key: 'weight', placeholder: '75' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm text-nt-text-secondary mb-1 block">{field.label}</label>
                    <input
                      type="number"
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Goal</label>
                  <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                    {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Activity Level</label>
                  <select value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                    className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                    {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-sm text-nt-text-secondary mb-2 block">Dietary Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        dietaryPreferences: prev.dietaryPreferences.includes(opt)
                          ? prev.dietaryPreferences.filter((o) => o !== opt)
                          : [...prev.dietaryPreferences, opt],
                      }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.dietaryPreferences.includes(opt) ? 'bg-nt-accent border-nt-accent text-white' : 'border-nt-border text-nt-text-secondary hover:border-nt-accent/50'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-nt-text-secondary mb-1 block">Days</label>
                  <select value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })}
                    className="bg-nt-bg border border-nt-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                    {[3, 5, 7, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <button
                  onClick={() => generatePlan.mutate()}
                  disabled={generatePlan.isPending || !form.age || !form.height || !form.weight}
                  className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 mt-4"
                >
                  {generatePlan.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Generating...</>) : (<><Sparkles className="w-4 h-4" />Generate Plan</>)}
                </button>
              </div>
            </motion.div>
          ) : (
            /* Generated plan preview + save */
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{generatedPlan.name}</h2>
                    <p className="text-nt-text-secondary text-sm">{generatedPlan.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGeneratedPlan(null)} className="text-sm text-nt-text-muted hover:text-white transition-colors">Regenerate</button>
                    <button
                      onClick={handleSaveGenerated}
                      disabled={savePlan.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {savePlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Plan
                    </button>
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

              {generatedPlan.days?.map((day: any) => (
                <div key={day.dayNumber} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === `gen-${day.dayNumber}` ? null : `gen-${day.dayNumber}`)}
                    className="w-full flex items-center justify-between p-5 hover:bg-nt-card-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-nt-accent/20 flex items-center justify-center text-sm font-bold text-nt-accent">{day.dayNumber}</div>
                      <div>
                        <div className="font-semibold">{day.dayName}</div>
                        <div className="text-xs text-nt-text-secondary">{day.totalCalories} kcal</div>
                      </div>
                    </div>
                    {expandedDay === `gen-${day.dayNumber}` ? <ChevronUp className="w-4 h-4 text-nt-text-muted" /> : <ChevronDown className="w-4 h-4 text-nt-text-muted" />}
                  </button>
                  <AnimatePresence>
                    {expandedDay === `gen-${day.dayNumber}` && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlanCard({
  plan, expandedDay, setExpandedDay, loggingDay, setLoggingDay,
  onActivate, onDelete, onLogDay, isActivating, isDeleting, isLogging,
}: {
  plan: any
  expandedDay: string | null
  setExpandedDay: (d: string | null) => void
  loggingDay: string | null
  setLoggingDay: (d: string | null) => void
  onActivate: () => void
  onDelete: () => void
  onLogDay: (dayNumber: number) => void
  isActivating: boolean
  isDeleting: boolean
  isLogging: boolean
}) {
  return (
    <div className={`glass-card overflow-hidden ${plan.isActive ? 'ring-1 ring-nt-accent' : ''}`}>
      {/* Plan header */}
      <div className="p-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{plan.name}</h3>
            {plan.isActive && (
              <span className="bg-nt-accent/20 text-nt-accent text-xs px-2 py-0.5 rounded-full border border-nt-accent/30">Active</span>
            )}
          </div>
          {plan.description && <p className="text-nt-text-secondary text-sm">{plan.description}</p>}
          <div className="flex gap-4 mt-2">
            {[
              { label: 'Cal', value: plan.targetCalories, color: 'text-purple-400' },
              { label: 'P', value: `${plan.targetProtein}g`, color: 'text-blue-400' },
              { label: 'C', value: `${plan.targetCarbs}g`, color: 'text-amber-400' },
              { label: 'F', value: `${plan.targetFat}g`, color: 'text-red-400' },
            ].map((m) => (
              <span key={m.label} className={`text-xs ${m.color}`}>{m.label}: {m.value}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!plan.isActive && (
            <button onClick={onActivate} disabled={isActivating}
              className="flex items-center gap-1 text-xs bg-nt-accent/20 border border-nt-accent/30 text-nt-accent hover:bg-nt-accent/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
              <Play className="w-3 h-3" /> Activate
            </button>
          )}
          <button onClick={onDelete} disabled={isDeleting}
            className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 p-1.5 rounded-lg transition-all disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days */}
      <div className="border-t border-nt-border">
        {plan.days?.map((day: any) => {
          const key = `${plan.id}-${day.dayNumber}`
          const isExpanded = expandedDay === key
          const totalCal = day.meals?.reduce((acc: number, m: any) =>
            acc + (m.foods?.reduce((a: number, f: any) => a + (f.food ? (f.food.calories * f.grams / 100) : 0), 0) || 0), 0) || 0

          return (
            <div key={day.id} className="border-b border-nt-border/50 last:border-0">
              <div className="flex items-center">
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : key)}
                  className="flex-1 flex items-center gap-3 p-4 hover:bg-nt-card-hover/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-nt-bg flex items-center justify-center text-xs font-bold text-nt-text-muted">{day.dayNumber}</div>
                  <div>
                    <div className="text-sm font-medium">{day.dayName}</div>
                    <div className="text-xs text-nt-text-muted">{Math.round(totalCal)} kcal • {day.meals?.length} meals</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-nt-text-muted ml-auto" /> : <ChevronDown className="w-4 h-4 text-nt-text-muted ml-auto" />}
                </button>
                <button
                  onClick={() => { setLoggingDay(key); onLogDay(day.dayNumber) }}
                  disabled={isLogging && loggingDay === key}
                  className="mr-4 flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  title="Log all meals from this day"
                >
                  {isLogging && loggingDay === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Log Day
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 bg-nt-bg/30">
                      {day.meals?.map((meal: any) => (
                        <div key={meal.id} className="pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Utensils className="w-3.5 h-3.5 text-nt-accent" />
                            <span className="text-sm font-medium">{meal.name}</span>
                            {meal.time && <span className="text-xs text-nt-text-muted">{meal.time}</span>}
                            <span className="ml-auto text-xs text-nt-text-secondary capitalize">{meal.mealType.toLowerCase()}</span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {meal.foods?.map((pf: any) => (
                              <div key={pf.id} className="flex justify-between text-xs py-1.5 px-2.5 bg-nt-bg rounded-lg">
                                <span className="text-nt-text-secondary">{pf.food?.name || 'Unknown'} <span className="text-nt-text-muted">({pf.grams}g)</span></span>
                                <span className="text-purple-400">{pf.food ? Math.round(pf.food.calories * pf.grams / 100) : '?'} kcal</span>
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
          )
        })}
      </div>
    </div>
  )
}
