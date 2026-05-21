import { PrismaClient } from '@prisma/client'

const XP_PER_LEVEL = 500

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function getXPForNextLevel(level: number): number {
  return level * XP_PER_LEVEL
}

export async function awardXP(prisma: PrismaClient, userId: string, xp: number, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const newXP = user.xp + xp
  const newLevel = getLevelFromXP(newXP)
  const leveledUp = newLevel > user.level

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  })

  return { newXP, newLevel, leveledUp, xpEarned: xp, reason }
}

export async function checkAndUpdateStreak(prisma: PrismaClient, userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastLog = user.lastLogDate ? new Date(user.lastLogDate) : null
  if (lastLog) {
    lastLog.setHours(0, 0, 0, 0)
  }

  let newStreak = user.streak

  if (!lastLog) {
    newStreak = 1
  } else if (lastLog.getTime() === today.getTime()) {
    // Already logged today, don't change streak
    return user.streak
  } else if (lastLog.getTime() === yesterday.getTime()) {
    // Logged yesterday, increment streak
    newStreak = user.streak + 1
  } else {
    // Missed a day, reset streak
    newStreak = 1
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastLogDate: new Date() },
  })

  // Check streak achievements
  if (newStreak === 7) {
    await unlockAchievement(prisma, userId, 'week_streak')
  } else if (newStreak === 30) {
    await unlockAchievement(prisma, userId, 'month_streak')
  }

  return newStreak
}

export async function unlockAchievement(prisma: PrismaClient, userId: string, achievementName: string) {
  const achievement = await prisma.achievement.findUnique({ where: { name: achievementName } })
  if (!achievement) return null

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  })

  if (existing) return null

  await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  })

  await awardXP(prisma, userId, achievement.xp, `Achievement: ${achievement.name}`)

  return achievement
}

export async function checkFirstLogAchievement(prisma: PrismaClient, userId: string) {
  const entryCount = await prisma.mealEntry.count({ where: { userId } })
  if (entryCount === 1) {
    await unlockAchievement(prisma, userId, 'first_log')
  }
}

export async function checkLevelAchievements(prisma: PrismaClient, userId: string, level: number) {
  if (level >= 5) await unlockAchievement(prisma, userId, 'level_5')
  if (level >= 10) await unlockAchievement(prisma, userId, 'level_10')
}
