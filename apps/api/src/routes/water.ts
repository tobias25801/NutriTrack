import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate, getUser } from '../middleware/auth'
import { awardXP } from '../services/gamification'

const waterRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get today's water intake
  fastify.get('/today', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const entries = await fastify.prisma.waterEntry.findMany({
      where: { userId, date: { gte: today, lt: tomorrow } },
      orderBy: { date: 'asc' },
    })

    const total = entries.reduce((acc, e) => acc + e.amount, 0)

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyWater: true },
    })

    return reply.send({ entries, total, goal: user?.dailyWater || 2000 })
  })

  // Add water entry
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { amount = 250, date } = request.body as { amount?: number; date?: string }

    if (amount <= 0 || amount > 5000) {
      return reply.status(400).send({ error: 'Amount must be between 1 and 5000 ml' })
    }

    const entry = await fastify.prisma.waterEntry.create({
      data: { userId, amount, date: date ? new Date(date) : new Date() },
    })

    await awardXP(fastify.prisma, userId, 2, 'water_logged')

    return reply.status(201).send(entry)
  })

  // Delete water entry
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const entry = await fastify.prisma.waterEntry.findFirst({ where: { id, userId } })
    if (!entry) {
      return reply.status(404).send({ error: 'Water entry not found' })
    }

    await fastify.prisma.waterEntry.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // Get water history (past 7 days)
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const entries = await fastify.prisma.waterEntry.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })

    const byDay = new Map<string, number>()
    for (const entry of entries) {
      const day = entry.date.toISOString().split('T')[0]
      byDay.set(day, (byDay.get(day) || 0) + entry.amount)
    }

    const history = Array.from(byDay.entries()).map(([date, total]) => ({ date, total }))
    return reply.send(history)
  })
}

export default waterRoutes
