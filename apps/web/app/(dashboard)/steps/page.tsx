'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Footprints, Target, TrendingUp, Trophy } from 'lucide-react'
import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

export default function StepsPage() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState(30)
  const [stepInput, setStepInput] = useState('')

  const { data: today } = useQuery({
    queryKey: ['steps', 'today'],
    queryFn: () => api.get('/steps/today').then((r) => r.data),
  })

  const { data: weekly } = useQuery({
    queryKey: ['steps', 'weekly'],
    queryFn: () => api.get('/steps/weekly').then((r) => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['steps', 'history', period],
    queryFn: () => api.get(`/steps/history?days=${period}`).then((r) => r.data),
  })

  const logSteps = useMutation({
    mutationFn: (steps: number) => api.post('/steps', { steps }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      setStepInput('')
      toast.success('Steps logged!')
    },
    onError: () => toast.error('Failed to log steps'),
  })

  const steps = today?.steps ?? 0
  const goal = today?.goal ?? 10000
  const pct = Math.min(100, Math.round((steps / goal) * 100))

  const weeklyData = (weekly?.weekly ?? []).map((d: any) => ({
    ...d,
    name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    fill: d.steps >= (weekly?.goal ?? 10000) ? '#22c55e' : '#7c4dff',
  }))

  const handleLog = () => {
    const val = parseInt(stepInput)
    if (!val || val < 0 || val > 100000) {
      toast.error('Enter steps between 0 and 100,000')
      return
    }
    logSteps.mutate(val)
  }

  const stats = history?.stats

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Footprints className="w-6 h-6 text-green-400" />
          Step Tracking
        </h1>
        <p className="text-nt-text-secondary text-sm">Monitor your daily activity and movement goals</p>
      </div>

      {/* Today + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's progress */}
        <motion.div {...fadeUp} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Today</h2>
            <span className="text-xs text-nt-text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="flex items-end gap-4 mb-6">
            <div>
              <div className="text-5xl font-bold">{steps.toLocaleString()}</div>
              <div className="text-nt-text-secondary text-sm mt-1">of {goal.toLocaleString()} steps</div>
            </div>
            <div className="mb-1">
              <span className={`text-lg font-semibold ${pct >= 100 ? 'text-green-400' : 'text-nt-accent'}`}>{pct}%</span>
            </div>
          </div>

          <div className="relative h-4 bg-nt-bg rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full rounded-full ${pct >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-nt-accent to-purple-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          {pct >= 100 ? (
            <div className="text-green-400 text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Daily goal achieved! Great work 🎉
            </div>
          ) : (
            <div className="text-nt-text-secondary text-sm">
              {(goal - steps).toLocaleString()} steps remaining to hit your goal
            </div>
          )}
        </motion.div>

        {/* Log steps */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-nt-accent" />
            Log Steps
          </h2>
          <div className="space-y-3">
            <input
              type="number"
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLog()}
              placeholder="Enter step count"
              className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
            />
            <div className="grid grid-cols-2 gap-2">
              {[2000, 5000, 8000, 10000].map((n) => (
                <button
                  key={n}
                  onClick={() => setStepInput(String(n))}
                  className="py-2 text-xs bg-nt-bg hover:bg-nt-card border border-nt-border hover:border-nt-accent/50 rounded-lg text-nt-text-secondary hover:text-white transition-all"
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              onClick={handleLog}
              disabled={logSteps.isPending || !stepInput}
              className="w-full bg-nt-accent hover:bg-nt-accent-hover text-white py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {logSteps.isPending ? 'Saving...' : 'Save Steps'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Weekly chart */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-nt-accent" />
          This Week
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: any) => [v.toLocaleString() + ' steps', 'Steps']}
            />
            <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
              {weeklyData.map((d: any, i: number) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-nt-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Goal reached</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-nt-accent inline-block" /> Below goal</span>
          <span className="ml-auto">Goal: {(weekly?.goal ?? 10000).toLocaleString()} steps/day</span>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Steps', value: stats.totalSteps.toLocaleString(), icon: Footprints, color: 'text-green-400' },
            { label: 'Daily Average', value: stats.avgSteps.toLocaleString(), icon: TrendingUp, color: 'text-nt-accent' },
            { label: 'Goals Hit', value: `${stats.goalsHit} days`, icon: Trophy, color: 'text-amber-400' },
            { label: 'Best Day', value: stats.bestDay ? stats.bestDay.steps.toLocaleString() : '—', icon: Target, color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-nt-text-secondary">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* History period selector + table */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Step History</h2>
          <div className="flex bg-nt-bg rounded-lg p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${period === p.value ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {history?.entries?.length === 0 ? (
          <div className="text-center py-10 text-nt-text-muted text-sm">No step data for this period</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {[...(history?.entries ?? [])].reverse().map((entry: any) => {
              const pct2 = Math.min(100, Math.round((entry.steps / goal) * 100))
              const goalHit = entry.steps >= goal
              return (
                <div key={entry.id} className="flex items-center gap-4 py-2 border-b border-nt-border/50">
                  <div className="w-24 text-xs text-nt-text-secondary flex-shrink-0">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-nt-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${goalHit ? 'bg-green-500' : 'bg-nt-accent'}`}
                        style={{ width: `${pct2}%` }}
                      />
                    </div>
                  </div>
                  <div className={`w-24 text-right text-sm font-medium flex-shrink-0 ${goalHit ? 'text-green-400' : 'text-white'}`}>
                    {entry.steps.toLocaleString()}
                    {goalHit && <span className="ml-1 text-xs">✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
