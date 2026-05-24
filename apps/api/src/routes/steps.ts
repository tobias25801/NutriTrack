import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'
import { awardXP } from '../services/gamification'

const stepsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get today's steps
  fastify.get('/today', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const entry = await fastify.prisma.stepEntry.findFirst({
      where: { userId, date: { gte: today, lt: tomorrow } },
      orderBy: { date: 'desc' },
    })

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { dailySteps: true },
    })

    return reply.send({ steps: entry?.steps ?? 0, goal: user?.dailySteps ?? 10000, entryId: entry?.id ?? null })
  })

  // Log / update steps for a date
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      steps: z.number().int().min(0).max(100000),
      date: z.string().optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const { steps, date } = result.data
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(12, 0, 0, 0)

    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Upsert: only one entry per day
    const existing = await fastify.prisma.stepEntry.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })

    let entry
    if (existing) {
      entry = await fastify.prisma.stepEntry.update({
        where: { id: existing.id },
        data: { steps },
      })
    } else {
      entry = await fastify.prisma.stepEntry.create({
        data: { userId, steps, date: targetDate },
      })
      await awardXP(fastify.prisma, userId, 5, 'steps_logged')
    }

    return reply.status(201).send(entry)
  })

  // Get step history (last N days)
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { days = '30' } = request.query as { days?: string }
    const numDays = Math.min(365, parseInt(days) || 30)

    const since = new Date()
    since.setDate(since.getDate() - numDays)
    since.setHours(0, 0, 0, 0)

    const entries = await fastify.prisma.stepEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    })

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { dailySteps: true },
    })

    const goal = user?.dailySteps ?? 10000
    const goalsHit = entries.filter((e) => e.steps >= goal).length
    const totalSteps = entries.reduce((acc, e) => acc + e.steps, 0)
    const avgSteps = entries.length ? Math.round(totalSteps / entries.length) : 0
    const bestDay = entries.reduce((best, e) => (e.steps > best.steps ? e : best), { steps: 0, date: new Date(), id: '', userId: '' })

    return reply.send({
      entries,
      stats: { totalSteps, avgSteps, goalsHit, bestDay: bestDay.steps > 0 ? bestDay : null },
      goal,
    })
  })

  // Get weekly summary
  fastify.get('/weekly', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const entries = await fastify.prisma.stepEntry.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { dailySteps: true },
    })

    const goal = user?.dailySteps ?? 10000
    const byDay: Record<string, number> = {}

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      byDay[d.toISOString().split('T')[0]] = 0
    }

    for (const entry of entries) {
      const day = entry.date.toISOString().split('T')[0]
      if (day in byDay) byDay[day] = entry.steps
    }

    const weekly = Object.entries(byDay).map(([date, steps]) => ({ date, steps }))
    return reply.send({ weekly, goal })
  })
}

export default stepsRoutes
