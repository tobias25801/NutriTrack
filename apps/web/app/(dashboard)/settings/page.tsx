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

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [importType, setImportType] = useState<'weight'>('weight')
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
    const bmr = calculateBMR(parseFloat(profile.weight), parseFloat(profile.height), parseInt(profile.age), profile.gender)
    const tdee = calculateTDEE(bmr, goals.activityLevel)
    const calories = getGoalCalories(tdee, goals.goal)
    const protein = Math.round(parseFloat(profile.weight) * 2.2)
    const fats = Math.round((calories * 0.3) / 9)
    const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)
    setGoals((prev) => ({ ...prev, dailyCalories: calories.toString(), dailyProtein: protein.toString(), dailyCarbs: carbs.toString(), dailyFat: fats.toString() }))
    toast.success('Goals calculated based on your stats!')
  }

  const downloadFile = (url: string, filename: string) => {
    api.get(url, { responseType: 'blob' }).then((res) => {
      const blobUrl = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
      toast.success('Download started!')
    }).catch(() => toast.error('Export failed'))
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportStatus('parsing')
    setImportResult(null)

    try {
      const text = await file.text()
      let data: any

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
        // Handle full JSON export format
        if (data.weightEntries) {
          data = { entries: data.weightEntries, overwrite: false }
        }
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
        data = {
          entries: lines.slice(1).map((line) => {
            const vals = line.split(',')
            return {
              date: vals[0]?.replace(/"/g, '').trim(),
              weight: parseFloat(vals[1] || '0'),
              bodyFat: vals[2] ? parseFloat(vals[2]) || undefined : undefined,
              muscleMass: vals[3] ? parseFloat(vals[3]) || undefined : undefined,
              note: vals[4]?.replace(/"/g, '').trim() || undefined,
            }
          }).filter((e) => e.date && e.weight > 0),
          overwrite: false,
        }
      } else {
        throw new Error('Unsupported file format. Use JSON or CSV.')
      }

      const res = await api.post(`/export/import/${importType}`, data)
      setImportResult(res.data)
      setImportStatus('success')
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      toast.success(`Imported ${res.data.imported} entries!`)
    } catch (err: any) {
      setImportStatus('error')
      toast.error(err.response?.data?.error || err.message || 'Import failed')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
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

      {/* Tabs */}
      <div className="flex bg-nt-card rounded-xl p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'}`}
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

          {/* Import */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-400" />
              Import Data
            </h2>
            <p className="text-nt-text-secondary text-sm mb-4">Import weight history from JSON or CSV</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-nt-text-secondary mb-1.5 block">Data Type</label>
                <select value={importType} onChange={(e) => setImportType(e.target.value as 'weight')}
                  className="bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent">
                  <option value="weight">Weight History</option>
                </select>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-nt-border hover:border-nt-accent/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-8 h-8 text-nt-text-muted group-hover:text-nt-accent mx-auto mb-3 transition-colors" />
                <div className="text-sm text-nt-text-secondary">
                  Click to select a file, or drag and drop
                </div>
                <div className="text-xs text-nt-text-muted mt-1">Supports JSON and CSV</div>
                <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleImportFile} />
              </div>

              {importStatus === 'parsing' && (
                <div className="flex items-center gap-2 text-sm text-nt-text-secondary p-3 bg-nt-bg rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-nt-accent" />
                  Processing file...
                </div>
              )}

              {importStatus === 'success' && importResult && (
                <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-green-400 font-medium">Import successful</div>
                    <div className="text-nt-text-secondary text-xs mt-0.5">
                      {importResult.imported} imported • {importResult.skipped} skipped • {importResult.total} total
                    </div>
                  </div>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="text-sm text-red-400">Import failed. Check the file format and try again.</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
