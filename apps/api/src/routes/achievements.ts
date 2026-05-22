import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate, getUser } from '../middleware/auth'

const achievementsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all achievements
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const [all, unlocked] = await Promise.all([
      fastify.prisma.achievement.findMany({ orderBy: { category: 'asc' } }),
      fastify.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ])

    // O(1) lookup instead of O(n) find() per achievement
    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]))

    return reply.send({
      achievements: all.map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id),
      })),
      unlockedCount: unlocked.length,
      totalCount: all.length,
    })
  })

  // Get user's unlocked achievements
  fastify.get('/my', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const achievements = await fastify.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    })

    return reply.send(achievements)
  })

  // Get user XP and level info
  fastify.get('/progress', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, streak: true },
    })

    if (!user) return reply.status(404).send({ error: 'User not found' })

    const XP_PER_LEVEL = 500
    const xpForCurrentLevel = (user.level - 1) * XP_PER_LEVEL
    const xpForNextLevel = user.level * XP_PER_LEVEL
    const xpProgress = user.xp - xpForCurrentLevel
    const xpNeeded = xpForNextLevel - xpForCurrentLevel

    return reply.send({
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      xpProgress,
      xpNeeded,
      progressPercent: Math.round((xpProgress / xpNeeded) * 100),
      nextLevel: user.level + 1,
    })
  })

  // Get daily challenges
  fastify.get('/challenges', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const challenges = await fastify.prisma.dailyChallenge.findMany({
      include: {
        userChallenges: {
          where: {
            userId,
            date: { gte: today, lt: tomorrow },
          },
        },
      },
    })

    return reply.send(
      challenges.map((c) => ({
        ...c,
        completed: c.userChallenges.length > 0 && c.userChallenges[0].completed,
        userChallenges: undefined,
      }))
    )
  })

  // Complete a challenge
  fastify.post('/challenges/:id/complete', { preHandler: authenticate }, async (request, reply) => {
    const { id: challengeId } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await fastify.prisma.userChallenge.findFirst({
      where: { userId, challengeId, date: { gte: today, lt: tomorrow } },
    })

    if (existing?.completed) {
      return reply.status(409).send({ error: 'Challenge already completed today' })
    }

    const challenge = await fastify.prisma.dailyChallenge.findUnique({ where: { id: challengeId } })
    if (!challenge) {
      return reply.status(404).send({ error: 'Challenge not found' })
    }

    if (existing) {
      await fastify.prisma.userChallenge.update({
        where: { id: existing.id },
        data: { completed: true, completedAt: new Date() },
      })
    } else {
      await fastify.prisma.userChallenge.create({
        data: { userId, challengeId, completed: true, completedAt: new Date() },
      })
    }

    const xpResult = await (await import('../services/gamification')).awardXP(
      fastify.prisma, userId, challenge.xp, `challenge:${challengeId}`
    )

    return reply.send({ success: true, xp: xpResult })
  })

  // Get leaderboard
  fastify.get('/leaderboard', { preHandler: authenticate }, async (request, reply) => {
    const { type = 'streak', limit = '20' } = request.query as { type?: string; limit?: string }

    const orderBy = type === 'xp' ? { xp: 'desc' as const } : { streak: 'desc' as const }

    const users = await fastify.prisma.user.findMany({
      orderBy,
      take: parseInt(limit),
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streak: true,
      },
    })

    return reply.send(users)
  })
}

export default achievementsRoutes
