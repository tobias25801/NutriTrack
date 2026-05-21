import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'
import { unlockAchievement } from '../services/gamification'

const weightRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all weight entries
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { limit = '90', startDate, endDate } = request.query as Record<string, string>
    const { sub: userId } = getUser(request)

    const where: Record<string, unknown> = { userId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const entries = await fastify.prisma.weightEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      take: parseInt(limit),
    })

    if (entries.length === 0) {
      return reply.send({ entries: [], stats: null })
    }

    const weights = entries.map((e) => e.weight)
    const latestWeight = weights[weights.length - 1]
    const firstWeight = weights[0]
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
    const change = latestWeight - firstWeight

    // Weekly averages
    const weeklyMap = new Map<string, number[]>()
    for (const entry of entries) {
      const weekStart = new Date(entry.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const key = weekStart.toISOString().split('T')[0]
      const existing = weeklyMap.get(key) || []
      existing.push(entry.weight)
      weeklyMap.set(key, existing)
    }

    const weeklyAverages = Array.from(weeklyMap.entries()).map(([week, w]) => ({
      week,
      average: w.reduce((a, b) => a + b, 0) / w.length,
    }))

    return reply.send({
      entries,
      stats: {
        current: latestWeight,
        starting: firstWeight,
        change,
        min: minWeight,
        max: maxWeight,
        average: avgWeight,
        weeklyAverages,
      },
    })
  })

  // Add weight entry
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      weight: z.number().min(20).max(500),
      bodyFat: z.number().min(1).max(70).optional(),
      muscleMass: z.number().min(1).optional(),
      note: z.string().max(200).optional(),
      date: z.string().optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const entry = await fastify.prisma.weightEntry.create({
      data: {
        userId,
        weight: result.data.weight,
        bodyFat: result.data.bodyFat,
        muscleMass: result.data.muscleMass,
        note: result.data.note,
        date: result.data.date ? new Date(result.data.date) : new Date(),
      },
    })

    // Update user's current weight
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { weight: result.data.weight },
    })

    // Check weight loss achievement
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } })
    const firstEntry = await fastify.prisma.weightEntry.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
    })

    if (user && firstEntry && firstEntry.weight - result.data.weight >= 5) {
      await unlockAchievement(fastify.prisma, userId, 'weight_loss_5')
    }

    return reply.status(201).send(entry)
  })

  // Update weight entry
  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const entry = await fastify.prisma.weightEntry.findFirst({ where: { id, userId } })
    if (!entry) {
      return reply.status(404).send({ error: 'Weight entry not found' })
    }

    const body = request.body as Record<string, unknown>
    const updated = await fastify.prisma.weightEntry.update({ where: { id }, data: body })
    return reply.send(updated)
  })

  // Delete weight entry
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const entry = await fastify.prisma.weightEntry.findFirst({ where: { id, userId } })
    if (!entry) {
      return reply.status(404).send({ error: 'Weight entry not found' })
    }

    await fastify.prisma.weightEntry.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // BMI calculation
  fastify.get('/bmi', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { weight: true, height: true },
    })

    if (!user?.weight || !user?.height) {
      return reply.status(400).send({ error: 'Weight and height required' })
    }

    const heightM = user.height / 100
    const bmi = user.weight / (heightM * heightM)

    let category = ''
    if (bmi < 18.5) category = 'Underweight'
    else if (bmi < 25) category = 'Normal weight'
    else if (bmi < 30) category = 'Overweight'
    else category = 'Obese'

    return reply.send({ bmi: Math.round(bmi * 10) / 10, category, weight: user.weight, height: user.height })
  })
}

export default weightRoutes
