'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { getLevelLabel } from '@/lib/utils'

export default function AchievementsPage() {
  const { user } = useAuthStore()

  const { data: achievementData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/achievements').then((r) => r.data),
  })

  const { data: progressData } = useQuery({
    queryKey: ['achievements', 'progress'],
    queryFn: () => api.get('/achievements/progress').then((r) => r.data),
  })

  const { data: challengeData } = useQuery({
    queryKey: ['achievements', 'challenges'],
    queryFn: () => api.get('/achievements/challenges').then((r) => r.data),
  })

  const { data: leaderboardData } = useQuery({
    queryKey: ['achievements', 'leaderboard'],
    queryFn: () => api.get('/achievements/leaderboard?type=streak').then((r) => r.data),
  })

  const achievements = achievementData?.achievements || []
  const categories = [...new Set(achievements.map((a: any) => a.category))]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-nt-text-secondary text-sm">Track your progress and earn rewards</p>
      </div>

      {/* Level Card */}
      {progressData && (
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-nt-accent/5 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nt-accent to-purple-500 flex flex-col items-center justify-center shadow-lg shadow-nt-accent/20">
              <span className="text-2xl font-bold">{user?.level}</span>
              <span className="text-xs text-white/70">LEVEL</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold">{getLevelLabel(user?.level || 1)}</span>
                <span className="text-sm text-nt-text-secondary">• {user?.xp?.toLocaleString()} XP total</span>
              </div>
              <div className="text-sm text-nt-text-secondary mb-3">
                {progressData.xpProgress} / {progressData.xpNeeded} XP to Level {progressData.nextLevel}
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-nt-accent to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressData.progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-2xl font-bold">{user?.streak || 0}</div>
              <div className="text-xs text-nt-text-secondary">day streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Challenges */}
      {challengeData && challengeData.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Daily Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {challengeData.map((challenge: any) => (
              <div
                key={challenge.id}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  challenge.completed
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-nt-bg border-nt-border'
                }`}
              >
                <span className="text-2xl">{challenge.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${challenge.completed ? 'line-through text-nt-text-secondary' : ''}`}>
                    {challenge.name}
                  </div>
                  <div className="text-xs text-nt-text-secondary">{challenge.description}</div>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  challenge.completed ? 'bg-green-500/20 text-green-400' : 'bg-nt-accent/10 text-nt-accent'
                }`}>
                  {challenge.completed ? '✓' : `+${challenge.xp} XP`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Categories */}
      {categories.map((category) => {
        const categoryAchievements = achievements.filter((a: any) => a.category === category)
        const unlockedCount = categoryAchievements.filter((a: any) => a.unlocked).length

        return (
          <div key={category as string} className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-nt-border">
              <h2 className="font-semibold capitalize">{(category as string).replace('_', ' ')}</h2>
              <span className="text-sm text-nt-text-secondary">
                {unlockedCount}/{categoryAchievements.length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
              {categoryAchievements.map((achievement: any, i: number) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border text-center relative ${
                    achievement.unlocked
                      ? 'bg-nt-accent/10 border-nt-accent/30'
                      : 'bg-nt-bg border-nt-border opacity-60'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.unlocked ? achievement.icon : '🔒'}</div>
                  <div className={`text-sm font-medium mb-1 ${achievement.unlocked ? '' : 'text-nt-text-secondary'}`}>
                    {achievement.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                  <div className="text-xs text-nt-text-secondary mb-2">{achievement.description}</div>
                  <div className={`text-xs font-semibold ${achievement.unlocked ? 'text-nt-accent' : 'text-nt-text-muted'}`}>
                    {achievement.xp} XP
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="absolute top-2 right-2 text-xs text-nt-text-muted">✓</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Leaderboard */}
      {leaderboardData && leaderboardData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-nt-border">
            <h2 className="font-semibold">Streak Leaderboard 🏆</h2>
          </div>
          <div className="divide-y divide-nt-border/50">
            {leaderboardData.slice(0, 10).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-nt-card-hover/50 transition-colors">
                <div className={`w-8 text-center font-bold text-sm ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-nt-text-muted'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nt-accent to-purple-500 flex items-center justify-center text-sm font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{u.username}</div>
                  <div className="text-xs text-nt-text-secondary">Level {u.level}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-400 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    {u.streak}
                  </div>
                  <div className="text-xs text-nt-text-muted">days</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
