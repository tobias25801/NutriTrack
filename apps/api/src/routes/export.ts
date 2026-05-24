import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'

const exportRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Export all user data as JSON
  fastify.get('/json', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const [user, mealEntries, weightEntries, waterEntries, stepEntries, fastingRecords] = await Promise.all([
      fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, username: true, weight: true, height: true,
          age: true, gender: true, goal: true, activityLevel: true,
          dailyCalories: true, dailyProtein: true, dailyCarbs: true,
          dailyFat: true, dailyWater: true, dailySteps: true,
          xp: true, level: true, streak: true, createdAt: true,
        },
      }),
      fastify.prisma.mealEntry.findMany({
        where: { userId },
        include: { food: { select: { name: true, brand: true } } },
        orderBy: { date: 'asc' },
      }),
      fastify.prisma.weightEntry.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      fastify.prisma.waterEntry.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      fastify.prisma.stepEntry.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      fastify.prisma.fastingRecord.findMany({ where: { userId }, orderBy: { startTime: 'asc' } }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user,
      mealEntries: mealEntries.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        foodName: e.food.name,
        brand: e.food.brand,
        mealType: e.mealType,
        grams: e.grams,
        calories: Math.round(e.calories * 10) / 10,
        protein: Math.round(e.protein * 10) / 10,
        carbs: Math.round(e.carbs * 10) / 10,
        fats: Math.round(e.fats * 10) / 10,
      })),
      weightEntries: weightEntries.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        weight: e.weight,
        bodyFat: e.bodyFat,
        muscleMass: e.muscleMass,
        note: e.note,
      })),
      waterEntries: waterEntries.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        amount: e.amount,
      })),
      stepEntries: stepEntries.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        steps: e.steps,
      })),
      fastingRecords: fastingRecords.map((r) => ({
        startTime: r.startTime.toISOString(),
        endTime: r.endTime?.toISOString() ?? null,
        targetHours: r.targetHours,
        completed: r.completed,
        note: r.note,
      })),
    }

    return reply.send(exportData)
  })

  // Export nutrition data as CSV
  fastify.get('/csv', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { type = 'nutrition' } = request.query as { type?: string }

    if (type === 'nutrition') {
      const entries = await fastify.prisma.mealEntry.findMany({
        where: { userId },
        include: { food: { select: { name: true, brand: true } } },
        orderBy: { date: 'asc' },
      })

      const header = 'Date,Food,Brand,Meal Type,Grams,Calories,Protein (g),Carbs (g),Fats (g)\n'
      const rows = entries.map((e) =>
        [
          e.date.toISOString().split('T')[0],
          `"${e.food.name.replace(/"/g, '""')}"`,
          `"${(e.food.brand ?? '').replace(/"/g, '""')}"`,
          e.mealType,
          e.grams,
          Math.round(e.calories * 10) / 10,
          Math.round(e.protein * 10) / 10,
          Math.round(e.carbs * 10) / 10,
          Math.round(e.fats * 10) / 10,
        ].join(',')
      )

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', 'attachment; filename="nutrition.csv"')
      return reply.send(header + rows.join('\n'))
    }

    if (type === 'weight') {
      const entries = await fastify.prisma.weightEntry.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      })

      const header = 'Date,Weight (kg),Body Fat (%),Muscle Mass (kg),Note\n'
      const rows = entries.map((e) =>
        [
          e.date.toISOString().split('T')[0],
          e.weight,
          e.bodyFat ?? '',
          e.muscleMass ?? '',
          `"${(e.note ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      )

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', 'attachment; filename="weight.csv"')
      return reply.send(header + rows.join('\n'))
    }

    if (type === 'steps') {
      const entries = await fastify.prisma.stepEntry.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      })

      const header = 'Date,Steps\n'
      const rows = entries.map((e) => [e.date.toISOString().split('T')[0], e.steps].join(','))

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', 'attachment; filename="steps.csv"')
      return reply.send(header + rows.join('\n'))
    }

    if (type === 'fasting') {
      const records = await fastify.prisma.fastingRecord.findMany({
        where: { userId },
        orderBy: { startTime: 'asc' },
      })

      const header = 'Start Time,End Time,Target Hours,Actual Hours,Completed,Note\n'
      const rows = records.map((r) => {
        const actualHours = r.endTime
          ? Math.round(((r.endTime.getTime() - r.startTime.getTime()) / 3600000) * 10) / 10
          : ''
        return [
          r.startTime.toISOString(),
          r.endTime?.toISOString() ?? '',
          r.targetHours,
          actualHours,
          r.completed,
          `"${(r.note ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      })

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', 'attachment; filename="fasting.csv"')
      return reply.send(header + rows.join('\n'))
    }

    return reply.status(400).send({ error: 'Invalid type. Use: nutrition, weight, steps, fasting' })
  })

  // Import weight data
  fastify.post('/import/weight', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      entries: z.array(z.object({
        date: z.string(),
        weight: z.number().min(20).max(500),
        bodyFat: z.number().min(1).max(70).optional(),
        muscleMass: z.number().min(1).optional(),
        note: z.string().max(200).optional(),
      })).min(1).max(1000),
      overwrite: z.boolean().default(false),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const { entries, overwrite } = result.data
    let imported = 0
    let skipped = 0

    for (const entry of entries) {
      const date = new Date(entry.date)
      if (isNaN(date.getTime())) { skipped++; continue }

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const existing = await fastify.prisma.weightEntry.findFirst({
        where: { userId, date: { gte: startOfDay, lte: endOfDay } },
      })

      if (existing && !overwrite) { skipped++; continue }
      if (existing && overwrite) {
        await fastify.prisma.weightEntry.update({
          where: { id: existing.id },
          data: { weight: entry.weight, bodyFat: entry.bodyFat, muscleMass: entry.muscleMass, note: entry.note },
        })
      } else {
        await fastify.prisma.weightEntry.create({
          data: { userId, weight: entry.weight, bodyFat: entry.bodyFat, muscleMass: entry.muscleMass, note: entry.note, date },
        })
      }
      imported++
    }

    return reply.send({ imported, skipped, total: entries.length })
  })
}

export default exportRoutes
