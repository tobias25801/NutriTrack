import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'
import { awardXP, checkAndUpdateStreak, checkFirstLogAchievement } from '../services/gamification'

const mealsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get meals for a date (defaults to today)
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { date } = request.query as { date?: string }
    const { sub: userId } = getUser(request)

    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const entries = await fastify.prisma.mealEntry.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        food: {
          select: {
            id: true, name: true, brand: true, calories: true,
            protein: true, carbs: true, fats: true,
            servingSize: true, servingUnit: true, imageUrl: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    const grouped = {
      BREAKFAST: entries.filter((e) => e.mealType === 'BREAKFAST'),
      LUNCH: entries.filter((e) => e.mealType === 'LUNCH'),
      DINNER: entries.filter((e) => e.mealType === 'DINNER'),
      SNACK: entries.filter((e) => e.mealType === 'SNACK'),
    }

    const totals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fats: acc.fats + e.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    return reply.send({ entries, grouped, totals, date: startOfDay.toISOString().split('T')[0] })
  })

  // Log a meal entry
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      foodId: z.string(),
      grams: z.number().min(1),
      mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
      date: z.string().optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const { foodId, grams, mealType, date } = result.data

    const food = await fastify.prisma.food.findUnique({ where: { id: foodId } })
    if (!food) {
      return reply.status(404).send({ error: 'Food not found' })
    }

    const ratio = grams / 100
    const calories = food.calories * ratio
    const protein = food.protein * ratio
    const carbs = food.carbs * ratio
    const fats = food.fats * ratio

    const entry = await fastify.prisma.mealEntry.create({
      data: {
        userId,
        foodId,
        grams,
        mealType,
        date: date ? new Date(date) : new Date(),
        calories,
        protein,
        carbs,
        fats,
      },
      include: { food: true },
    })

    // Gamification
    await checkFirstLogAchievement(fastify.prisma, userId)
    const newStreak = await checkAndUpdateStreak(fastify.prisma, userId)
    const xpResult = await awardXP(fastify.prisma, userId, 10, 'meal_logged')

    return reply.status(201).send({ entry, streak: newStreak, xp: xpResult })
  })

  // Update meal entry
  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const entry = await fastify.prisma.mealEntry.findFirst({
      where: { id, userId },
      include: { food: true },
    })

    if (!entry) {
      return reply.status(404).send({ error: 'Meal entry not found' })
    }

    const { grams, mealType } = request.body as { grams?: number; mealType?: string }

    const food = entry.food
    const newGrams = grams ?? entry.grams
    const ratio = newGrams / 100

    const updated = await fastify.prisma.mealEntry.update({
      where: { id },
      data: {
        grams: newGrams,
        mealType: (mealType as any) ?? entry.mealType,
        calories: food.calories * ratio,
        protein: food.protein * ratio,
        carbs: food.carbs * ratio,
        fats: food.fats * ratio,
      },
      include: { food: true },
    })

    return reply.send(updated)
  })

  // Delete meal entry
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const entry = await fastify.prisma.mealEntry.findFirst({ where: { id, userId } })
    if (!entry) {
      return reply.status(404).send({ error: 'Meal entry not found' })
    }

    await fastify.prisma.mealEntry.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // Get nutrition summary for a date range
  fastify.get('/nutrition/summary', { preHandler: authenticate }, async (request, reply) => {
    const { startDate, endDate, groupBy = 'day' } = request.query as Record<string, string>
    const { sub: userId } = getUser(request)

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // Aggregate in the database — avoids loading every row into Node memory
    type SummaryRow = { date: Date; calories: number; protein: number; carbs: number; fats: number; count: bigint }
    const rows = await fastify.prisma.$queryRaw<SummaryRow[]>`
      SELECT
        date_trunc('day', date AT TIME ZONE 'UTC') AS date,
        SUM(calories)::float  AS calories,
        SUM(protein)::float   AS protein,
        SUM(carbs)::float     AS carbs,
        SUM(fats)::float      AS fats,
        COUNT(*)              AS count
      FROM meal_entries
      WHERE user_id = ${userId}
        AND date >= ${start}
        AND date <= ${end}
      GROUP BY date_trunc('day', date AT TIME ZONE 'UTC')
      ORDER BY date_trunc('day', date AT TIME ZONE 'UTC')
    `

    const dailySummaries = rows.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fats: r.fats,
      count: Number(r.count),
    }))

    const days = dailySummaries.length || 1
    const totals = dailySummaries.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fats: acc.fats + d.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
    const averages = {
      calories: totals.calories / days,
      protein: totals.protein / days,
      carbs: totals.carbs / days,
      fats: totals.fats / days,
    }

    return reply.send({ dailySummaries, totals, averages, days })
  })
}

export default mealsRoutes
