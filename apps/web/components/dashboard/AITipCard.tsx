'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bot, RefreshCw, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

export function AITipCard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai', 'tip'],
    queryFn: () => api.get('/ai/tip').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return (
    <div className="glass-card p-5 h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-nt-accent/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-nt-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-nt-accent" />
          </div>
          <span className="text-sm font-medium">AI Tip of the Day</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg hover:bg-nt-card-hover transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-nt-text-muted ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2">
        <Sparkles className="w-4 h-4 text-nt-accent flex-shrink-0 mt-0.5" />
        {isLoading ? (
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-nt-border rounded shimmer" />
            <div className="h-3 bg-nt-border rounded shimmer w-3/4" />
          </div>
        ) : (
          <motion.p
            key={data?.tip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-nt-text-secondary leading-relaxed"
          >
            {data?.tip || 'Stay consistent with your nutrition tracking for the best results!'}
          </motion.p>
        )}
      </div>
    </div>
  )
}
