import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'

const mealPlansRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List user's saved plans
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const plans = await fastify.prisma.mealPlan.findMany({
      where: { userId },
      include: {
        days: {
          include: {
            meals: {
              include: { foods: { include: { food: true } } },
            },
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ plans })
  })

  // Get a single plan
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const plan = await fastify.prisma.mealPlan.findFirst({
      where: { id, userId },
      include: {
        days: {
          include: {
            meals: {
              include: { foods: { include: { food: true } } },
            },
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    })

    if (!plan) return reply.status(404).send({ error: 'Plan not found' })
    return reply.send(plan)
  })

  // Save an AI-generated plan
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const foodSchema = z.object({
      name: z.string(),
      grams: z.number(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fats: z.number(),
    })

    const mealSchema = z.object({
      name: z.string(),
      mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).default('BREAKFAST'),
      time: z.string().optional(),
      foods: z.array(foodSchema),
    })

    const daySchema = z.object({
      dayNumber: z.number().int(),
      dayName: z.string(),
      meals: z.array(mealSchema),
    })

    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      targetCalories: z.number().int(),
      targetProtein: z.number().int(),
      targetCarbs: z.number().int(),
      targetFat: z.number().int(),
      days: z.array(daySchema),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const data = result.data

    // Deactivate other plans
    await fastify.prisma.mealPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    // Build food lookup or create placeholder foods
    const plan = await fastify.prisma.mealPlan.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        targetCalories: data.targetCalories,
        targetProtein: data.targetProtein,
        targetCarbs: data.targetCarbs,
        targetFat: data.targetFat,
        isActive: true,
        days: {
          create: data.days.map((day) => ({
            dayNumber: day.dayNumber,
            dayName: day.dayName,
            meals: {
              create: day.meals.map((meal) => ({
                name: meal.name,
                mealType: meal.mealType,
                time: meal.time,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          include: {
            meals: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    })

    // Now add foods to each meal — we create anonymous food entries for AI-generated items
    for (let di = 0; di < data.days.length; di++) {
      const day = data.days[di]
      const savedDay = plan.days[di]
      for (let mi = 0; mi < day.meals.length; mi++) {
        const meal = day.meals[mi]
        const savedMeal = savedDay.meals[mi]
        for (const foodItem of meal.foods) {
          // Find or create a food record
          let food = await fastify.prisma.food.findFirst({
            where: { name: foodItem.name, isPublic: true },
          })
          if (!food) {
            food = await fastify.prisma.food.create({
              data: {
                name: foodItem.name,
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fats: foodItem.fats,
                servingSize: 100,
                servingUnit: 'g',
                isPublic: true,
                isVerified: false,
              },
            })
          }
          await fastify.prisma.planMealFood.create({
            data: { planMealId: savedMeal.id, foodId: food.id, grams: foodItem.grams },
          })
        }
      }
    }

    return reply.status(201).send({ success: true, planId: plan.id })
  })

  // Activate a plan
  fastify.put('/:id/activate', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const plan = await fastify.prisma.mealPlan.findFirst({ where: { id, userId } })
    if (!plan) return reply.status(404).send({ error: 'Plan not found' })

    await fastify.prisma.mealPlan.updateMany({ where: { userId }, data: { isActive: false } })
    await fastify.prisma.mealPlan.update({ where: { id }, data: { isActive: true } })

    return reply.send({ success: true })
  })

  // Delete a plan
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const plan = await fastify.prisma.mealPlan.findFirst({ where: { id, userId } })
    if (!plan) return reply.status(404).send({ error: 'Plan not found' })

    await fastify.prisma.mealPlan.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // Log a plan meal as actual meal entries
  fastify.post('/:planId/days/:dayNumber/log', { preHandler: authenticate }, async (request, reply) => {
    const { planId, dayNumber } = request.params as { planId: string; dayNumber: string }
    const { sub: userId } = getUser(request)
    const { date } = request.body as { date?: string }

    const plan = await fastify.prisma.mealPlan.findFirst({ where: { id: planId, userId } })
    if (!plan) return reply.status(404).send({ error: 'Plan not found' })

    const day = await fastify.prisma.planDay.findFirst({
      where: { mealPlanId: planId, dayNumber: parseInt(dayNumber) },
      include: {
        meals: {
          include: { foods: { include: { food: true } } },
        },
      },
    })

    if (!day) return reply.status(404).send({ error: 'Day not found in plan' })

    const targetDate = date ? new Date(date) : new Date()

    const created = []
    for (const meal of day.meals) {
      for (const planFood of meal.foods) {
        const food = planFood.food
        const ratio = planFood.grams / 100
        const entry = await fastify.prisma.mealEntry.create({
          data: {
            userId,
            foodId: food.id,
            grams: planFood.grams,
            mealType: meal.mealType,
            date: targetDate,
            calories: food.calories * ratio,
            protein: food.protein * ratio,
            carbs: food.carbs * ratio,
            fats: food.fats * ratio,
          },
          include: { food: true },
        })
        created.push(entry)
      }
    }

    return reply.status(201).send({ logged: created.length, entries: created })
  })
}

export default mealPlansRoutes
