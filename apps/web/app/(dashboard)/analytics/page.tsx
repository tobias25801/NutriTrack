'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie,
  PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const PERIOD_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState(14)

  const { data: nutritionData } = useQuery({
    queryKey: ['nutrition', 'summary', period],
    queryFn: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - period + 1)
      return api.get(`/meals/nutrition/summary?startDate=${start.toISOString()}&endDate=${end.toISOString()}`).then((r) => r.data)
    },
  })

  const { data: weightData } = useQuery({
    queryKey: ['weight', 'history', period],
    queryFn: () => api.get(`/weight?limit=${period}`).then((r) => r.data),
  })

  const dailyData = nutritionData?.dailySummaries?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Calories: Math.round(d.calories),
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fats: Math.round(d.fats),
  })) || []

  const weightChartData = weightData?.entries?.map((e: any) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight,
  })) || []

  const averages = nutritionData?.averages || {}
  const dailyGoal = user?.dailyCalories || 2000

  // Macro distribution pie
  const macroTotal = (averages.protein || 0) * 4 + (averages.carbs || 0) * 4 + (averages.fats || 0) * 9
  const pieData = macroTotal > 0 ? [
    { name: 'Protein', value: Math.round(((averages.protein || 0) * 4 / macroTotal) * 100), color: '#3b82f6' },
    { name: 'Carbs', value: Math.round(((averages.carbs || 0) * 4 / macroTotal) * 100), color: '#f59e0b' },
    { name: 'Fats', value: Math.round(((averages.fats || 0) * 9 / macroTotal) * 100), color: '#ef4444' },
  ] : []

  const tooltipStyle = {
    contentStyle: { background: '#171923', border: '1px solid #1f2937', borderRadius: 12 },
    labelStyle: { color: '#9ca3af' },
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-nt-text-secondary text-sm">Deep dive into your nutrition data</p>
        </div>
        <div className="flex bg-nt-card rounded-xl p-1 gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setPeriod(opt.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === opt.days ? 'bg-nt-accent text-white' : 'text-nt-text-secondary hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Calories', value: `${Math.round(averages.calories || 0)}`, unit: 'kcal', goal: dailyGoal, color: 'text-purple-400' },
          { label: 'Avg Protein', value: `${Math.round(averages.protein || 0)}`, unit: 'g', goal: user?.dailyProtein, color: 'text-blue-400' },
          { label: 'Avg Carbs', value: `${Math.round(averages.carbs || 0)}`, unit: 'g', goal: user?.dailyCarbs, color: 'text-amber-400' },
          { label: 'Avg Fats', value: `${Math.round(averages.fats || 0)}`, unit: 'g', goal: user?.dailyFat, color: 'text-red-400' },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5">
            <div className="text-sm text-nt-text-secondary mb-2">{item.label}</div>
            <div className={`text-3xl font-bold ${item.color}`}>
              {item.value}
              <span className="text-lg font-normal text-nt-text-secondary ml-1">{item.unit}</span>
            </div>
            {item.goal && (
              <div className="text-xs text-nt-text-muted mt-1">Goal: {item.goal}{item.unit}</div>
            )}
          </div>
        ))}
      </div>

      {/* Calorie Chart */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-5">Daily Calories</h3>
        {dailyData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-nt-text-muted text-sm">No data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="calGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c4dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="Calories" stroke="#7c4dff" strokeWidth={2} fill="url(#calGrad2)" dot={false} name="Calories (kcal)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Macros + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Macro bars */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-semibold mb-5">Daily Macros</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Bar dataKey="Protein" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="Carbs" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="Fats" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold mb-4 self-start">Macro Split</h3>
          {pieData.length === 0 ? (
            <div className="text-nt-text-muted text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} contentStyle={{ background: '#171923', border: '1px solid #1f2937', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-xs">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-nt-text-secondary">{p.name}: {p.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weight chart */}
      {weightChartData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-5">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weightChartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="weightGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fill="url(#weightGrad2)" dot={{ fill: '#10b981', r: 3 }} name="Weight (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
