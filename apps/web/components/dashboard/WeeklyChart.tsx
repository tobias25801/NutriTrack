'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass-card p-3 text-sm border-nt-border/50">
      <p className="text-nt-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {Math.round(p.value)}{p.name === 'Calories' ? ' kcal' : 'g'}
        </p>
      ))}
    </div>
  )
}

export function WeeklyChart() {
  const { user } = useAuthStore()
  const [view, setView] = useState<'calories' | 'macros'>('calories')

  const { data, isLoading } = useQuery({
    queryKey: ['meals', 'nutrition', 'weekly'],
    queryFn: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return api.get(`/meals/nutrition/summary?startDate=${start.toISOString()}&endDate=${end.toISOString()}`).then((r) => r.data)
    },
  })

  const chartData = data?.dailySummaries?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    Calories: Math.round(day.calories),
    Protein: Math.round(day.protein),
    Carbs: Math.round(day.carbs),
    Fats: Math.round(day.fats),
  })) || []

  const tabs = ['calories', 'macros'] as const

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Weekly Overview</h3>
        <div className="flex bg-nt-bg rounded-lg p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                view === tab ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-nt-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-nt-text-muted text-sm">
          No data yet. Start logging meals!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          {view === 'calories' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c4dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              {user?.dailyCalories && (
                <line
                  x1="0" y1={user.dailyCalories}
                  x2="100%" y2={user.dailyCalories}
                  stroke="#7c4dff" strokeDasharray="4 4" strokeWidth={1} opacity={0.5}
                />
              )}
              <Area type="monotone" dataKey="Calories" stroke="#7c4dff" strokeWidth={2} fill="url(#colorCalories)" dot={{ fill: '#7c4dff', r: 3 }} />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Protein" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="Carbs" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="Fats" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}
