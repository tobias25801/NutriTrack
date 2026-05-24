'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertCircle, CheckCircle2, Database, Download, Loader2, Save, Target, Upload, User,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { calculateBMR, calculateTDEE, getGoalCalories } from '@/lib/utils'

type Tab = 'profile' | 'goals' | 'account'
type ImportType = 'weight' | 'nutrition'
type ImportStep = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

interface NutritionEntry {
  date: string; foodName: string; brand?: string; mealType: string
  grams: number; calories: number; protein: number; carbs: number; fats: number
}
interface WeightEntry {
  date: string; weight: number; bodyFat?: number; muscleMass?: number; note?: string
}
interface PreviewState {
  validCount: number; invalidCount: number; total: number
  preview: any[]; errors: { row: number; entry?: any; reason: string }[]
  payload: any
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let inQuote = false; let cur = ''
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ } else inQuote = !inQuote
    } else if (line[i] === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
    else cur += line[i]
  }
  cols.push(cur.trim()); return cols
}

const MEAL_TYPES = new Set(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])

function parseNutritionCSV(text: string): NutritionEntry[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const c = parseCSVLine(line)
    const mealType = c[3]?.toUpperCase()
    return {
      date: c[0] || '', foodName: c[1] || '', brand: c[2] || undefined,
      mealType: MEAL_TYPES.has(mealType) ? mealType : 'BREAKFAST',
      grams: parseFloat(c[4] || '100') || 100, calories: parseFloat(c[5] || '0') || 0,
      protein: parseFloat(c[6] || '0') || 0, carbs: parseFloat(c[7] || '0') || 0,
      fats: parseFloat(c[8] || '0') || 0,
    }
  }).filter((e) => e.date && e.foodName)
}

function parseWeightCSV(text: string): WeightEntry[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const c = parseCSVLine(line)
    return {
      date: c[0] || '', weight: parseFloat(c[1] || '0'),
      bodyFat: c[2] ? parseFloat(c[2]) || undefined : undefined,
      muscleMass: c[3] ? parseFloat(c[3]) || undefined : undefined,
      note: c[4] || undefined,
    }
  }).filter((e) => e.date && e.weight > 0)
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Import wizard state
  const [importType, setImportType] = useState<ImportType>('nutrition')
  const [importStep, setImportStep] = useState<ImportStep>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewState | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; errors?: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        gender: profile.gender, units: profile.units,
      }),
    onSuccess: (res) => { setUser(res.data.user); toast.success('Profile updated! ✓') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  })

  const updateGoals = useMutation({
    mutationFn: () =>
      api.put('/auth/me', {
        goal: goals.goal, activityLevel: goals.activityLevel,
        dailyCalories: parseInt(goals.dailyCalories), dailyProtein: parseInt(goals.dailyProtein),
        dailyCarbs: parseInt(goals.dailyCarbs), dailyFat: parseInt(goals.dailyFat),
        dailyWater: parseInt(goals.dailyWater), dailySteps: parseInt(goals.dailySteps),
      }),
    onSuccess: (res) => { setUser(res.data.user); toast.success('Goals updated! ✓') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  })

  const autoCalculate = () => {
    if (!profile.age || !profile.height || !profile.weight) {
      toast.error('Please fill in age, height, and weight first'); return
    }
    const bmr = calculateBMR(parseFloat(profile.weight), parseFloat(profile.height), parseInt(profile.age), profile.gender)
    const tdee = calculateTDEE(bmr, goals.activityLevel)
    const calories = getGoalCalories(tdee, goals.goal)
    const protein = Math.round(parseFloat(profile.weight) * 2.2)
    const fats = Math.round((calories * 0.3) / 9)
    const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)
    setGoals((prev) => ({ ...prev, dailyCalories: calories.toString(), dailyProtein: protein.toString(), dailyCarbs: carbs.toString(), dailyFat: fats.toString() }))
    toast.success('Goals calculated!')
  }

  const downloadFile = (url: string, filename: string) => {
    api.get(url, { responseType: 'blob' }).then((res) => {
      const blobUrl = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = blobUrl; a.download = filename; a.click()
      URL.revokeObjectURL(blobUrl); toast.success('Download started!')
    }).catch(() => toast.error('Export failed'))
  }

  const resetImport = () => {
    setImportStep('idle'); setPreviewData(null); setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(json|csv)$/i)) {
      toast.error('Unsupported format. Use JSON or CSV.'); return
    }
    setImportStep('parsing')
    try {
      const text = await file.text()

      if (importType === 'nutrition') {
        let entries: NutritionEntry[]
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text)
          entries = json.mealEntries ?? json.entries ?? []
        } else {
          entries = parseNutritionCSV(text)
        }
        if (entries.length === 0) throw new Error('No valid entries found in file')
        const res = await api.post('/export/import/preview', { entries })
        setPreviewData({ ...res.data, payload: { entries, overwrite: false } })
        setImportStep('preview')
      } else {
        let entries: WeightEntry[]
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text)
          entries = json.weightEntries ?? json.entries ?? []
        } else {
          entries = parseWeightCSV(text)
        }
        if (entries.length === 0) throw new Error('No valid entries found in file')
        setPreviewData({
          validCount: entries.length, invalidCount: 0, total: entries.length,
          preview: entries.slice(0, 10), errors: [],
          payload: { entries, overwrite: false },
        })
        setImportStep('preview')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to parse file')
      setImportStep('idle')
    }
  }

  const confirmImport = async () => {
    if (!previewData?.payload) return
    setImportStep('importing')
    try {
      const endpoint = importType === 'nutrition' ? '/export/import/nutrition' : '/export/import/weight'
      const res = await api.post(endpoint, previewData.payload)
      setImportResult(res.data)
      setImportStep('done')
      queryClient.invalidateQueries({ queryKey: [importType === 'nutrition' ? 'meals' : 'weight'] })
      toast.success(`Imported ${res.data.imported} entries!`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed')
      setImportStep('idle')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'account', label: 'Data & Export', icon: Database },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-nt-text-secondary text-sm">Manage your profile and preferences</p>
      </div>

      <div className="flex bg-nt-card rounded-xl p-1 gap-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'}`}>
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
                <input type={field.type || 'text'} value={(profile as any)[field.key]}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Gender</label>
              <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Units</label>
              <select value={profile.units} onChange={(e) => setProfile({ ...profile, units: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, in)</option>
              </select>
            </div>
          </div>
          <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
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
            <button onClick={autoCalculate} className="text-sm text-nt-accent hover:text-nt-accent-hover transition-colors">Auto-calculate →</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Goal</label>
              <select value={goals.goal} onChange={(e) => setGoals({ ...goals, goal: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                <option value="LOSE_WEIGHT">Lose Weight</option>
                <option value="MAINTAIN">Maintain</option>
                <option value="GAIN_MUSCLE">Gain Muscle</option>
                <option value="IMPROVE_HEALTH">Improve Health</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Activity Level</label>
              <select value={goals.activityLevel} onChange={(e) => setGoals({ ...goals, activityLevel: e.target.value })}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
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
                <input type="number" value={(goals as any)[field.key]}
                  onChange={(e) => setGoals({ ...goals, [field.key]: e.target.value })}
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors" />
              </div>
            ))}
          </div>
          <button onClick={() => updateGoals.mutate()} disabled={updateGoals.isPending}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
            {updateGoals.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Goals
          </button>
        </motion.div>
      )}

      {/* Data Tab */}
      {activeTab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Account info */}
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-semibold">Account Information</h2>
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

          {/* Export */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-nt-accent" />
              Export Data
            </h2>
            <p className="text-nt-text-secondary text-sm mb-4">Download your data in various formats</p>
            <div className="space-y-3">
              <div className="p-3 bg-nt-bg rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Full Export (JSON)</div>
                  <div className="text-xs text-nt-text-muted">All your data in one file</div>
                </div>
                <button onClick={() => downloadFile('/export/json', 'nutritrack-export.json')}
                  className="flex items-center gap-1.5 text-xs bg-nt-accent/20 border border-nt-accent/30 text-nt-accent hover:bg-nt-accent/30 px-3 py-1.5 rounded-lg transition-all">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
              {[
                { label: 'Nutrition Log (CSV)', type: 'nutrition', desc: 'All meal entries' },
                { label: 'Weight History (CSV)', type: 'weight', desc: 'Weight & body composition' },
                { label: 'Step History (CSV)', type: 'steps', desc: 'Daily step counts' },
                { label: 'Fasting Records (CSV)', type: 'fasting', desc: 'Fasting history' },
              ].map((exp) => (
                <div key={exp.type} className="p-3 bg-nt-bg rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{exp.label}</div>
                    <div className="text-xs text-nt-text-muted">{exp.desc}</div>
                  </div>
                  <button onClick={() => downloadFile(`/export/csv?type=${exp.type}`, `nutritrack-${exp.type}.csv`)}
                    className="flex items-center gap-1.5 text-xs bg-nt-border/50 border border-nt-border text-nt-text-secondary hover:text-white hover:border-nt-accent/50 px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Import Wizard */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-400" />
              Import Data
            </h2>
            <p className="text-nt-text-secondary text-sm mb-5">Import nutrition or weight history from JSON or CSV</p>

            {importStep === 'idle' && (
              <div className="space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'nutrition' as ImportType, label: 'Nutrition Log', desc: 'Meal entries (CSV / JSON)' },
                    { value: 'weight' as ImportType, label: 'Weight History', desc: 'Weight entries (CSV / JSON)' },
                  ] as const).map((opt) => (
                    <button key={opt.value} onClick={() => setImportType(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${importType === opt.value ? 'border-nt-accent bg-nt-accent/10' : 'border-nt-border bg-nt-bg hover:border-nt-accent/40'}`}>
                      <div className={`text-sm font-semibold ${importType === opt.value ? 'text-nt-accent' : 'text-white'}`}>{opt.label}</div>
                      <div className="text-xs text-nt-text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-nt-accent bg-nt-accent/10 scale-[1.01]' : 'border-nt-border hover:border-nt-accent/50 hover:bg-nt-accent/5'}`}>
                  <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-nt-accent' : 'text-nt-text-muted'}`} />
                  <div className="text-sm text-nt-text-secondary font-medium">
                    {isDragging ? 'Drop file here' : 'Click to select or drag & drop'}
                  </div>
                  <div className="text-xs text-nt-text-muted mt-1">
                    {importType === 'nutrition'
                      ? 'CSV: Date, Food, Brand, Meal Type, Grams, Calories, Protein, Carbs, Fats'
                      : 'CSV: Date, Weight, Body Fat, Muscle Mass, Note'}
                  </div>
                  <div className="text-xs text-nt-text-muted mt-0.5">Supports JSON and CSV</div>
                  <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
                </div>
              </div>
            )}

            {importStep === 'parsing' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-nt-accent" />
                <div className="text-sm text-nt-text-secondary">Analyzing file...</div>
              </div>
            )}

            {importStep === 'preview' && previewData && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-xl font-bold text-green-400">{previewData.validCount}</div>
                    <div className="text-xs text-nt-text-muted">valid entries</div>
                  </div>
                  {previewData.invalidCount > 0 && (
                    <div className="flex-1 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="text-xl font-bold text-red-400">{previewData.invalidCount}</div>
                      <div className="text-xs text-nt-text-muted">invalid entries</div>
                    </div>
                  )}
                  <div className="flex-1 p-3 bg-nt-bg border border-nt-border rounded-xl">
                    <div className="text-xl font-bold text-white">{previewData.total}</div>
                    <div className="text-xs text-nt-text-muted">total</div>
                  </div>
                </div>

                {/* Preview table */}
                {previewData.preview.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-nt-text-muted mb-2 uppercase tracking-wide">
                      Preview (first {previewData.preview.length} entries)
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-nt-border">
                      <table className="w-full text-xs">
                        <thead className="bg-nt-bg">
                          <tr>
                            {importType === 'nutrition' ? (
                              <>
                                <th className="text-left px-3 py-2 text-nt-text-muted font-medium">Date</th>
                                <th className="text-left px-3 py-2 text-nt-text-muted font-medium">Food</th>
                                <th className="text-left px-3 py-2 text-nt-text-muted font-medium">Type</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">g</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">kcal</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">P</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">C</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">F</th>
                              </>
                            ) : (
                              <>
                                <th className="text-left px-3 py-2 text-nt-text-muted font-medium">Date</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">Weight</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">Body Fat</th>
                                <th className="text-right px-3 py-2 text-nt-text-muted font-medium">Muscle</th>
                                <th className="text-left px-3 py-2 text-nt-text-muted font-medium">Note</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.preview.map((row: any, i: number) => (
                            <tr key={i} className="border-t border-nt-border/50 hover:bg-nt-bg/50 transition-colors">
                              {importType === 'nutrition' ? (
                                <>
                                  <td className="px-3 py-2 text-nt-text-secondary">{row.date}</td>
                                  <td className="px-3 py-2 text-white font-medium max-w-[120px] truncate">{row.foodName}</td>
                                  <td className="px-3 py-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-nt-accent/20 text-nt-accent">{row.mealType}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-nt-text-secondary">{row.grams}</td>
                                  <td className="px-3 py-2 text-right text-white font-medium">{Math.round(row.calories)}</td>
                                  <td className="px-3 py-2 text-right text-blue-400">{Math.round(row.protein)}</td>
                                  <td className="px-3 py-2 text-right text-amber-400">{Math.round(row.carbs)}</td>
                                  <td className="px-3 py-2 text-right text-red-400">{Math.round(row.fats)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2 text-nt-text-secondary">{row.date}</td>
                                  <td className="px-3 py-2 text-right text-white font-medium">{row.weight} kg</td>
                                  <td className="px-3 py-2 text-right text-nt-text-secondary">{row.bodyFat ? `${row.bodyFat}%` : '—'}</td>
                                  <td className="px-3 py-2 text-right text-nt-text-secondary">{row.muscleMass ? `${row.muscleMass} kg` : '—'}</td>
                                  <td className="px-3 py-2 text-nt-text-secondary truncate max-w-[100px]">{row.note || '—'}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Validation errors */}
                {previewData.errors.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Validation Errors ({previewData.errors.length})
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-red-500/20 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-red-500/10 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 text-red-400 font-medium">Row</th>
                            <th className="text-left px-3 py-2 text-red-400 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.errors.map((err: any, i: number) => (
                            <tr key={i} className="border-t border-red-500/10">
                              <td className="px-3 py-1.5 text-red-400 font-medium">{err.row}</td>
                              <td className="px-3 py-1.5 text-red-300">{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={resetImport}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-nt-border text-nt-text-secondary hover:text-white hover:border-nt-accent/50 transition-all">
                    Cancel
                  </button>
                  <button onClick={confirmImport} disabled={previewData.validCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-green-500 hover:bg-green-400 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Upload className="w-4 h-4" />
                    Import {previewData.validCount} {importType === 'nutrition' ? 'Meals' : 'Entries'}
                  </button>
                </div>
              </div>
            )}

            {importStep === 'importing' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <div className="text-sm text-nt-text-secondary">Importing data...</div>
              </div>
            )}

            {importStep === 'done' && importResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-green-400 font-semibold">Import complete</div>
                    <div className="text-nt-text-secondary text-sm mt-1">
                      {importResult.imported} imported · {importResult.skipped} skipped · {importResult.total} total
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="text-amber-400 text-xs mt-1">{importResult.errors.length} rows had errors</div>
                    )}
                  </div>
                </div>
                <button onClick={resetImport}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border border-nt-border text-nt-text-secondary hover:text-white hover:border-nt-accent/50 transition-all">
                  Import Another File
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
