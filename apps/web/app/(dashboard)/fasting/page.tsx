'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Flame, History, Loader2, Play, Square, Timer, Trophy, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

const PRESETS = [
  { label: '16:8', hours: 16, desc: 'Most popular' },
  { label: '18:6', hours: 18, desc: 'Moderate' },
  { label: '20:4', hours: 20, desc: 'Advanced' },
  { label: '24h', hours: 24, desc: 'One meal/day' },
]

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function CircularProgress({ pct, size = 220 }: { pct: number; size?: number }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(100, pct)) / 100

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={pct >= 100 ? '#22c55e' : '#7c4dff'}
        strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  )
}

export default function FastingPage() {
  const queryClient = useQueryClient()
  const [customHours, setCustomHours] = useState('')
  const [note, setNote] = useState('')
  const [tick, setTick] = useState(0)
  const [showHistory, setShowHistory] = useState(false)

  const { data: activeData, isLoading } = useQuery({
    queryKey: ['fasting', 'active'],
    queryFn: () => api.get('/fasting/active').then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['fasting', 'stats'],
    queryFn: () => api.get('/fasting/stats').then((r) => r.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['fasting', 'history'],
    queryFn: () => api.get('/fasting/history?limit=10').then((r) => r.data),
    enabled: showHistory,
  })

  useEffect(() => {
    if (!activeData?.active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [activeData?.active])

  const startFast = useMutation({
    mutationFn: ({ targetHours, note }: { targetHours: number; note?: string }) =>
      api.post('/fasting/start', { targetHours, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasting'] })
      setNote('')
      toast.success('Fast started! Stay strong 💪')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to start fast'),
  })

  const stopFast = useMutation({
    mutationFn: (id: string) => api.put(`/fasting/${id}/stop`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fasting', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['fasting', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['fasting', 'history'] })
      if (res.data.completed) {
        toast.success(`Fast completed! ${res.data.elapsedHours}h 🏆 +25 XP`)
      } else {
        toast.info(`Fast ended at ${res.data.elapsedHours}h`)
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to end fast'),
  })

  const active = activeData?.active
  const elapsed = active ? Date.now() - new Date(active.startTime).getTime() : 0
  const targetMs = active ? active.targetHours * 3600000 : 0
  const pct = active ? Math.min(100, (elapsed / targetMs) * 100) : 0
  const remaining = active ? Math.max(0, targetMs - elapsed) : 0
  const isComplete = active && elapsed >= targetMs

  const handleStart = (hours: number) => {
    if (hours < 1 || hours > 72) {
      toast.error('Fast duration must be 1–72 hours')
      return
    }
    startFast.mutate({ targetHours: hours, note: note || undefined })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Timer className="w-6 h-6 text-orange-400" />
          Intermittent Fasting
        </h1>
        <p className="text-nt-text-secondary text-sm">Track and manage your fasting windows</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-nt-accent" />
        </div>
      ) : active ? (
        /* Active fast */
        <motion.div {...fadeUp} className="glass-card p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs px-3 py-1.5 rounded-full mb-6">
            <Flame className="w-3 h-3" />
            Fasting in progress — {active.targetHours}h goal
          </div>

          <div className="relative flex justify-center mb-6">
            <CircularProgress pct={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold font-mono ${isComplete ? 'text-green-400' : 'text-white'}`}>
                {formatDuration(elapsed)}
              </div>
              <div className="text-nt-text-muted text-sm mt-1">{Math.round(pct)}%</div>
            </div>
          </div>

          {isComplete ? (
            <div className="text-green-400 text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" /> Goal reached!
            </div>
          ) : (
            <div className="text-nt-text-secondary mb-4">
              <span className="text-white font-medium">{formatDuration(remaining)}</span> remaining
            </div>
          )}

          <div className="text-xs text-nt-text-muted mb-6">
            Started {new Date(active.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {active.note && <span className="ml-2">• {active.note}</span>}
          </div>

          <button
            onClick={() => stopFast.mutate(active.id)}
            disabled={stopFast.isPending}
            className="flex items-center gap-2 mx-auto bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {stopFast.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            End Fast
          </button>
        </motion.div>
      ) : (
        /* Start new fast */
        <motion.div {...fadeUp} className="glass-card p-6">
          <h2 className="font-semibold mb-5 flex items-center gap-2">
            <Play className="w-4 h-4 text-nt-accent" />
            Start a New Fast
          </h2>

          {/* Presets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {PRESETS.map((p) => (
              <button
                key={p.hours}
                onClick={() => handleStart(p.hours)}
                disabled={startFast.isPending}
                className="p-4 bg-nt-bg border border-nt-border hover:border-nt-accent hover:bg-nt-card rounded-xl text-left transition-all group disabled:opacity-50"
              >
                <div className="text-xl font-bold group-hover:text-nt-accent transition-colors">{p.label}</div>
                <div className="text-xs text-nt-text-muted mt-1">{p.desc}</div>
                <div className="text-xs text-nt-text-secondary mt-1">{p.hours}h fast</div>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Custom duration (hours)</label>
              <input
                type="number"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="e.g. 22"
                min={1}
                max={72}
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-nt-text-secondary mb-1.5 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. skipping breakfast"
                className="w-full bg-nt-bg border border-nt-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleStart(parseInt(customHours))}
                disabled={startFast.isPending || !customHours}
                className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {startFast.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {statsData && (
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Fasts', value: statsData.totalFasts, icon: Trophy, color: 'text-amber-400' },
            { label: 'Total Hours', value: `${statsData.totalHours}h`, icon: Clock, color: 'text-nt-accent' },
            { label: 'Avg Duration', value: `${statsData.avgHours}h`, icon: Timer, color: 'text-blue-400' },
            { label: 'Longest Fast', value: `${statsData.longestFast}h`, icon: Flame, color: 'text-orange-400' },
            { label: 'Current Streak', value: `${statsData.currentStreak} days`, icon: Zap, color: 'text-green-400' },
            { label: 'Last 30 Days', value: `${statsData.last30Days} fasts`, icon: History, color: 'text-purple-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-nt-text-secondary">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* History */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="glass-card p-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-nt-text-muted" />
            Fasting History
          </h2>
          <span className="text-nt-text-muted text-xs">{showHistory ? 'Hide ▲' : 'Show ▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-5 space-y-3">
            {historyData?.records?.length === 0 ? (
              <div className="text-center py-8 text-nt-text-muted text-sm">No completed fasts yet</div>
            ) : (
              historyData?.records?.map((r: any) => {
                const pct2 = Math.min(100, Math.round((r.elapsedHours / r.targetHours) * 100))
                return (
                  <div key={r.id} className="flex items-center gap-4 p-3 bg-nt-bg rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${r.completed ? 'bg-green-500/20 text-green-400' : 'bg-nt-border text-nt-text-muted'}`}>
                      {r.completed ? '✓' : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {r.elapsedHours}h of {r.targetHours}h target
                        {r.note && <span className="text-nt-text-muted ml-2 text-xs">• {r.note}</span>}
                      </div>
                      <div className="text-xs text-nt-text-muted mt-0.5">
                        {new Date(r.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="h-1.5 bg-nt-border rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${r.completed ? 'bg-green-500' : 'bg-nt-accent'}`}
                          style={{ width: `${pct2}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-nt-text-muted">{pct2}%</div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
