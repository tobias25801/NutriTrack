'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

function formatDuration(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FastingWidget() {
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)

  const { data } = useQuery({
    queryKey: ['fasting', 'active'],
    queryFn: () => api.get('/fasting/active').then((r) => r.data),
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (!data?.active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [data?.active])

  const startFast = useMutation({
    mutationFn: (hours: number) => api.post('/fasting/start', { targetHours: hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasting'] })
      toast.success('Fast started! 🎯')
    },
  })

  const stopFast = useMutation({
    mutationFn: (id: string) => api.put(`/fasting/${id}/stop`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fasting'] })
      toast.success(res.data.completed ? 'Fast completed! 🏆 +25 XP' : 'Fast ended')
    },
  })

  const active = data?.active

  if (active) {
    const elapsed = Date.now() - new Date(active.startTime).getTime()
    const targetMs = active.targetHours * 3600000
    const pct = Math.min(100, (elapsed / targetMs) * 100)
    const remaining = Math.max(0, targetMs - elapsed)
    const isComplete = elapsed >= targetMs

    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-nt-text-secondary font-medium">Fasting</span>
          <Timer className="w-4 h-4 text-orange-400" />
        </div>

        <div className={`text-3xl font-bold font-mono mb-1 ${isComplete ? 'text-green-400' : 'text-white'}`}>
          {formatDuration(elapsed)}
        </div>
        <div className="text-xs text-nt-text-secondary mb-3">
          {isComplete ? '✅ Goal reached!' : `${formatDuration(remaining)} remaining`} • {active.targetHours}h goal
        </div>

        <div className="progress-bar mb-3">
          <motion.div
            className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => stopFast.mutate(active.id)}
            disabled={stopFast.isPending}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg transition-all"
          >
            End Fast
          </button>
          <Link href="/fasting" className="text-xs text-nt-text-muted hover:text-nt-text-secondary">
            Details →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-nt-text-secondary font-medium">Fasting</span>
        <Timer className="w-4 h-4 text-nt-text-muted" />
      </div>

      <div className="text-sm text-nt-text-secondary mb-4">No active fast</div>

      <div className="flex gap-2 flex-wrap">
        {[16, 18, 20].map((h) => (
          <button
            key={h}
            onClick={() => startFast.mutate(h)}
            disabled={startFast.isPending}
            className="flex-1 py-2 text-xs bg-nt-bg border border-nt-border hover:border-nt-accent hover:text-nt-accent rounded-lg transition-all disabled:opacity-50"
          >
            {h}:{ 24 - h}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <Link href="/fasting" className="text-xs text-nt-accent hover:underline">
          Custom fast →
        </Link>
      </div>
    </div>
  )
}
