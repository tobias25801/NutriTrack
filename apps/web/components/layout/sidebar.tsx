'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bot,
  Flame,
  Footprints,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  Timer,
  Trophy,
  UtensilsCrossed,
  Users,
  Utensils,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { getLevelLabel } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/food-log', icon: UtensilsCrossed, label: 'Food Log' },
  { href: '/food-database', icon: Utensils, label: 'Food Database' },
  { href: '/meal-plans', icon: Activity, label: 'Meal Plans' },
  { href: '/fasting', icon: Timer, label: 'Fasting' },
  { href: '/steps', icon: Footprints, label: 'Steps' },
  { href: '/weight-tracking', icon: Scale, label: 'Weight' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { href: '/social', icon: Users, label: 'Social' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const xpForCurrentLevel = ((user?.level || 1) - 1) * 500
  const xpForNextLevel = (user?.level || 1) * 500
  const xpProgress = (user?.xp || 0) - xpForCurrentLevel
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const xpPercent = Math.round((xpProgress / xpNeeded) * 100)

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="w-64 flex-shrink-0 border-r border-nt-border bg-nt-card/50 flex flex-col h-full"
    >
      {/* Logo */}
      <div className="p-5 border-b border-nt-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nt-accent to-purple-400 flex items-center justify-center shadow-lg shadow-nt-accent/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">NutriTrack</span>
        </Link>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-nt-border">
          <div className="flex items-center gap-3 mb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nt-accent to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{user.username}</div>
              <div className="text-xs text-nt-text-secondary">
                {getLevelLabel(user.level)} • Lv.{user.level}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-nt-text-muted">
              <span>{user.xp.toLocaleString()} XP</span>
              <span>{xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="h-full bg-gradient-to-r from-nt-accent to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          {/* Streak */}
          {user.streak > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="text-orange-400">🔥</span>
              <span className="text-nt-text-secondary">{user.streak} day streak</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'sidebar-item-active' : 'sidebar-item'}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-nt-accent"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-nt-border space-y-1">
        <Link href="/settings" className={pathname === '/settings' ? 'sidebar-item-active' : 'sidebar-item'}>
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-item w-full text-left hover:text-red-400">
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </motion.aside>
  )
}
