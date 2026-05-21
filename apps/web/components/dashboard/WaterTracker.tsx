'use client'

import { motion } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface WaterTrackerProps {
  current: number
  goal: number
}

export function WaterTracker({ current, goal }: WaterTrackerProps) {
  const queryClient = useQueryClient()
  const percent = Math.min(100, Math.round((current / goal) * 100))

  const addWater = useMutation({
    mutationFn: (amount: number) => api.post('/water', { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water', 'today'] })
    },
    onError: () => toast.error('Failed to log water'),
  })

  const amounts = [150, 250, 350, 500]

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-nt-text-secondary">Water Intake</span>
        </div>
        <span className="text-xs text-nt-text-muted">{percent}%</span>
      </div>

      {/* Visual */}
      <div className="flex items-end justify-center gap-0.5 mb-4 h-12">
        {Array.from({ length: 8 }).map((_, i) => {
          const filled = (current / goal) * 8 > i
          return (
            <motion.div
              key={i}
              className={`w-5 rounded-t-sm transition-colors ${filled ? 'bg-blue-500' : 'bg-nt-border'}`}
              style={{ height: `${40 + i * 3}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          )
        })}
      </div>

      <div className="text-center mb-4">
        <span className="text-2xl font-bold text-blue-400">{current}</span>
        <span className="text-sm text-nt-text-secondary ml-1">/ {goal} ml</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {amounts.map((amount) => (
          <button
            key={amount}
            onClick={() => addWater.mutate(amount)}
            disabled={addWater.isPending}
            className="text-xs py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors disabled:opacity-50"
          >
            +{amount}ml
          </button>
        ))}
      </div>
    </div>
  )
}
