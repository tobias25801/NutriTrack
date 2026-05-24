'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { flushQueue, getQueueLength } from '@/lib/syncQueue'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [queueLen, setQueueLen] = useState(0)
  const queryClient = useQueryClient()
  const prevOnline = useRef(true)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      if (!prevOnline.current) {
        toast.success('Back online! Syncing data...')
        handleSync()
      }
      prevOnline.current = true
    }
    const handleOffline = () => {
      setOnline(false)
      prevOnline.current = false
      toast.warning('You are offline. Changes will sync when reconnected.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setOnline(navigator.onLine)
    setQueueLen(getQueueLength())

    // Listen for service worker sync messages
    navigator.serviceWorker?.addEventListener('message', (e) => {
      if (e.data?.type === 'SYNC_REQUESTED') handleSync()
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    const len = getQueueLength()
    if (len === 0) return
    setSyncing(true)
    try {
      const result = await flushQueue(async (req) => {
        await api.request({ method: req.method, url: req.url, data: req.body })
      })
      queryClient.invalidateQueries()
      if (result.synced > 0) toast.success(`Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}!`)
      if (result.failed > 0) toast.error(`${result.failed} item(s) failed to sync`)
      setQueueLen(getQueueLength())
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AnimatePresence>
      {(!online || queueLen > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg border ${
            online
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}
        >
          {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>
            {online ? `${queueLen} pending sync${queueLen !== 1 ? 's' : ''}` : 'Offline'}
          </span>
          {online && queueLen > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1 text-xs underline hover:no-underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
