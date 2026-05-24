import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'
import { awardXP } from '../services/gamification'

const fastingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get active fast (if any)
  fastify.get('/active', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const active = await fastify.prisma.fastingRecord.findFirst({
      where: { userId, endTime: null, completed: false },
      orderBy: { startTime: 'desc' },
    })

    if (!active) return reply.send({ active: null })

    const elapsed = Date.now() - active.startTime.getTime()
    const targetMs = active.targetHours * 60 * 60 * 1000
    const progressPct = Math.min(100, (elapsed / targetMs) * 100)

    return reply.send({
      active: {
        ...active,
        elapsedMs: elapsed,
        targetMs,
        progressPct,
        isComplete: elapsed >= targetMs,
      },
    })
  })

  // Start a fast
  fastify.post('/start', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      targetHours: z.number().int().min(1).max(72).default(16),
      note: z.string().max(200).optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    // Cancel any active fast first
    await fastify.prisma.fastingRecord.updateMany({
      where: { userId, endTime: null, completed: false },
      data: { endTime: new Date(), completed: false },
    })

    const record = await fastify.prisma.fastingRecord.create({
      data: {
        userId,
        startTime: new Date(),
        targetHours: result.data.targetHours,
        note: result.data.note,
      },
    })

    return reply.status(201).send(record)
  })

  // Stop / complete a fast
  fastify.put('/:id/stop', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const record = await fastify.prisma.fastingRecord.findFirst({ where: { id, userId } })
    if (!record) return reply.status(404).send({ error: 'Fasting record not found' })
    if (record.endTime) return reply.status(400).send({ error: 'Fast already ended' })

    const endTime = new Date()
    const elapsedHours = (endTime.getTime() - record.startTime.getTime()) / (1000 * 60 * 60)
    const completed = elapsedHours >= record.targetHours

    const updated = await fastify.prisma.fastingRecord.update({
      where: { id },
      data: { endTime, completed },
    })

    if (completed) {
      await awardXP(fastify.prisma, userId, 25, 'fast_completed')
    }

    return reply.send({ ...updated, elapsedHours: Math.round(elapsedHours * 10) / 10, completed })
  })

  // Get fasting history
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { limit = '20', page = '1' } = request.query as { limit?: string; page?: string }
    const take = Math.min(100, parseInt(limit) || 20)
    const skip = (parseInt(page) - 1) * take

    const [records, total] = await Promise.all([
      fastify.prisma.fastingRecord.findMany({
        where: { userId, endTime: { not: null } },
        orderBy: { startTime: 'desc' },
        take,
        skip,
      }),
      fastify.prisma.fastingRecord.count({ where: { userId, endTime: { not: null } } }),
    ])

    const enriched = records.map((r) => {
      const elapsedHours = r.endTime
        ? (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
        : 0
      return { ...r, elapsedHours: Math.round(elapsedHours * 10) / 10 }
    })

    return reply.send({ records: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / take) })
  })

  // Get fasting stats
  fastify.get('/stats', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const allCompleted = await fastify.prisma.fastingRecord.findMany({
      where: { userId, completed: true },
      orderBy: { startTime: 'desc' },
    })

    const totalFasts = allCompleted.length
    const totalHours = allCompleted.reduce((acc, r) => {
      if (!r.endTime) return acc
      return acc + (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
    }, 0)

    const longestFast = allCompleted.reduce((best, r) => {
      if (!r.endTime) return best
      const hours = (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
      return hours > best ? hours : best
    }, 0)

    // Consecutive days streak
    const dates = new Set(allCompleted.map((r) => r.startTime.toISOString().split('T')[0]))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      if (dates.has(d.toISOString().split('T')[0])) {
        streak++
      } else {
        break
      }
    }

    // Last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCount = allCompleted.filter((r) => r.startTime >= thirtyDaysAgo).length

    return reply.send({
      totalFasts,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: totalFasts ? Math.round((totalHours / totalFasts) * 10) / 10 : 0,
      longestFast: Math.round(longestFast * 10) / 10,
      currentStreak: streak,
      last30Days: recentCount,
    })
  })
}

export default fastingRoutes
