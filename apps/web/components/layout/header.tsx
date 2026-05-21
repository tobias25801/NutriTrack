'use client'

import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const router = useRouter()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/food-database?q=${encodeURIComponent(search)}`)
      setSearch('')
    }
  }

  return (
    <header className="border-b border-nt-border bg-nt-card/30 backdrop-blur-md px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        {/* Greeting */}
        <div className="hidden md:block">
          <h2 className="text-sm text-nt-text-secondary">{today}</h2>
          <h1 className="text-lg font-semibold">
            {getGreeting()},{' '}
            <span className="gradient-text">{user?.username || 'there'}</span> 👋
          </h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nt-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search foods..."
              className="w-full bg-nt-bg border border-nt-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent/50 transition-all"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-nt-card-hover transition-colors">
            <Bell className="w-5 h-5 text-nt-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-nt-accent" />
          </button>
        </div>
      </div>
    </header>
  )
}
