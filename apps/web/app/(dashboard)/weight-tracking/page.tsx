'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'

export default function WeightTrackingPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [weight, setWeight] = useState(user?.weight?.toString() || '')
  const [bodyFat, setBodyFat] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['weight'],
    queryFn: () => api.get('/weight?limit=90').then((r) => r.data),
  })

  const { data: bmiData } = useQuery({
    queryKey: ['weight', 'bmi'],
    queryFn: () => api.get('/weight/bmi').then((r) => r.data),
    enabled: !!(user?.weight && user?.height),
  })

  const addWeight = useMutation({
    mutationFn: () => api.post('/weight', {
      weight: parseFloat(weight),
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      note: note || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      setShowAddForm(false)
      setNote('')
      toast.success('Weight logged! 📊')
    },
    onError: () => toast.error('Failed to log weight'),
  })

  const entries = data?.entries || []
  const stats = data?.stats

  const chartData = entries.map((e: any) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight,
    bodyFat: e.bodyFat,
  }))

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-400'
    if (bmi < 25) return 'text-green-400'
    if (bmi < 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weight Tracking</h1>
          <p className="text-nt-text-secondary text-sm">Monitor your progress over time</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-nt-accent/25"
        >
          <Plus className="w-4 h-4" />
          Log Weight
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold mb-4">Log Today's Weight</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-nt-text-secondary mb-1 block">Weight (kg) *</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.1"
                min="20"
                max="500"
                placeholder="75.0"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-nt-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-nt-text-secondary mb-1 block">Body Fat % (optional)</label>
              <input
                type="number"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                step="0.1"
                min="1"
                max="70"
                placeholder="20.0"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-nt-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-nt-text-secondary mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., After workout"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-nt-accent transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => addWeight.mutate()}
              disabled={!weight || addWeight.isPending}
              className="bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {addWeight.isPending ? 'Saving...' : 'Save Weight'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 rounded-xl text-sm border border-nt-border hover:bg-nt-card-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current', value: `${stats.current} kg`, icon: Scale, color: 'text-white' },
            {
              label: 'Change',
              value: `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)} kg`,
              icon: stats.change <= 0 ? TrendingDown : TrendingUp,
              color: stats.change <= 0 ? 'text-green-400' : 'text-red-400',
            },
            { label: 'Lowest', value: `${stats.min} kg`, icon: TrendingDown, color: 'text-blue-400' },
            { label: 'Highest', value: `${stats.max} kg`, icon: TrendingUp, color: 'text-orange-400' },
          ].map((item) => (
            <div key={item.label} className="glass-card p-5">
              <div className="flex items-center gap-2 text-nt-text-secondary mb-2 text-sm">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* BMI */}
      {bmiData && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-nt-text-secondary mb-1">Body Mass Index</div>
              <div className={`text-4xl font-bold ${getBMIColor(bmiData.bmi)}`}>{bmiData.bmi}</div>
              <div className="text-sm text-nt-text-secondary mt-1">{bmiData.category}</div>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'Under', range: '< 18.5', color: 'bg-blue-500/20 text-blue-400' },
                { label: 'Normal', range: '18.5–24.9', color: 'bg-green-500/20 text-green-400' },
                { label: 'Over', range: '25–29.9', color: 'bg-yellow-500/20 text-yellow-400' },
                { label: 'Obese', range: '≥ 30', color: 'bg-red-500/20 text-red-400' },
              ].map((cat) => (
                <div key={cat.label} className={`px-3 py-2 rounded-lg text-center ${cat.color}`}>
                  <div className="text-xs font-medium">{cat.label}</div>
                  <div className="text-xs opacity-75">{cat.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Weight History (90 days)</h3>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-nt-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-nt-text-muted">
            <Scale className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No weight entries yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c4dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false} tickLine={false}
                width={40}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#171923', border: '1px solid #1f2937', borderRadius: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#7c4dff' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#7c4dff" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: '#7c4dff', r: 3 }} name="Weight (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entry History */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-nt-border">
          <h3 className="font-semibold">Entry History</h3>
        </div>
        <div className="divide-y divide-nt-border/50">
          {entries.slice(0, 20).map((entry: any) => (
            <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-nt-card-hover/50 transition-colors">
              <div>
                <div className="font-medium">{entry.weight} kg</div>
                <div className="text-xs text-nt-text-secondary">
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {entry.note && ` • ${entry.note}`}
                </div>
              </div>
              {entry.bodyFat && (
                <div className="text-sm text-nt-text-secondary">{entry.bodyFat}% body fat</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
