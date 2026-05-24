'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Footprints } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { getPercentage } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export function StepWidget() {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)

  const { data } = useQuery({
    queryKey: ['steps', 'today'],
    queryFn: () => api.get('/steps/today').then((r) => r.data),
    refetchInterval: 120000,
  })

  const logSteps = useMutation({
    mutationFn: (steps: number) => api.post('/steps', { steps }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      setEditing(false)
      setInput('')
      toast.success('Steps updated!')
    },
    onError: () => toast.error('Failed to log steps'),
  })

  const steps = data?.steps ?? 0
  const goal = data?.goal ?? 10000
  const pct = getPercentage(steps, goal)

  const handleSave = () => {
    const val = parseInt(input)
    if (!val || val < 0 || val > 100000) {
      toast.error('Enter a valid step count (0–100,000)')
      return
    }
    logSteps.mutate(val)
  }

  return (
    <div className="glass-card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-nt-text-secondary font-medium">Steps Today</span>
        <Footprints className="w-4 h-4 text-green-400" />
      </div>

      <div className="text-4xl font-bold mb-1">{steps.toLocaleString()}</div>
      <div className="text-xs text-nt-text-secondary mb-3">of {goal.toLocaleString()} goal</div>

      <div className="progress-bar mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="text-xs text-nt-text-muted mb-4">{pct}% of daily goal</div>

      {editing ? (
        <div className="flex gap-2 mt-auto">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. 8000"
            className="flex-1 bg-nt-bg border border-nt-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-nt-accent"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={logSteps.isPending}
            className="bg-nt-accent hover:bg-nt-accent-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            Save
          </button>
          <button onClick={() => setEditing(false)} className="text-nt-text-muted text-sm px-2">✕</button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-auto">
          <button
            onClick={() => { setEditing(true); setInput(steps > 0 ? String(steps) : '') }}
            className="text-xs text-nt-accent hover:underline"
          >
            Log steps
          </button>
          <Link href="/steps" className="text-xs text-nt-text-muted hover:text-nt-text-secondary">
            View history →
          </Link>
        </div>
      )}
    </div>
  )
}
