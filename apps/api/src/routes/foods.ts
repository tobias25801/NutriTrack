import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, getUser } from '../middleware/auth'
import { lookupBarcode } from '../services/barcode'
import { estimateFoodFromName } from '../services/openai'

const foodsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Search foods
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { q, page = '1', limit = '20', category } = request.query as Record<string, string>
    const { sub: userId } = getUser(request)

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = Math.min(parseInt(limit), 50)

    const where: Record<string, unknown> = { isPublic: true }

    if (q) {
      where.name = { contains: q, mode: 'insensitive' }
    }

    const [foods, total] = await Promise.all([
      fastify.prisma.food.findMany({
        where: {
          AND: [
            where,
            {
              OR: [
                { isPublic: true },
                { createdById: userId },
              ],
            },
          ],
        },
        orderBy: q ? { name: 'asc' } : { createdAt: 'desc' },
        skip,
        take,
        include: {
          favoritedBy: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      fastify.prisma.food.count({
        where: {
          AND: [
            where,
            { OR: [{ isPublic: true }, { createdById: userId }] },
          ],
        },
      }),
    ])

    return reply.send({
      foods: foods.map((f) => ({
        ...f,
        isFavorite: f.favoritedBy.length > 0,
        favoritedBy: undefined,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
    })
  })

  // Get food by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const food = await fastify.prisma.food.findFirst({
      where: {
        id,
        OR: [{ isPublic: true }, { createdById: userId }],
      },
      include: {
        favoritedBy: { where: { userId }, select: { id: true } },
      },
    })

    if (!food) {
      return reply.status(404).send({ error: 'Food not found' })
    }

    return reply.send({ ...food, isFavorite: food.favoritedBy.length > 0, favoritedBy: undefined })
  })

  // Lookup by barcode
  fastify.get('/barcode/:barcode', { preHandler: authenticate }, async (request, reply) => {
    const { barcode } = request.params as { barcode: string }

    // Check local DB first
    const existing = await fastify.prisma.food.findUnique({ where: { barcode } })
    if (existing) {
      return reply.send({ food: existing, source: 'database' })
    }

    // Try Open Food Facts
    const product = await lookupBarcode(barcode)
    if (product) {
      // Save to database for future lookups
      const food = await fastify.prisma.food.create({ data: product })
      return reply.send({ food, source: 'openfoodfacts' })
    }

    return reply.status(404).send({ error: 'Product not found', barcode })
  })

  // Create custom food
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const schema = z.object({
      name: z.string().min(1).max(100),
      brand: z.string().optional(),
      barcode: z.string().optional(),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fats: z.number().min(0),
      fiber: z.number().min(0).optional(),
      sugar: z.number().min(0).optional(),
      sodium: z.number().min(0).optional(),
      servingSize: z.number().min(0).default(100),
      servingUnit: z.string().default('g'),
      imageUrl: z.string().url().optional(),
      isPublic: z.boolean().default(false),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    if (result.data.barcode) {
      const existing = await fastify.prisma.food.findUnique({ where: { barcode: result.data.barcode } })
      if (existing) {
        return reply.status(409).send({ error: 'Food with this barcode already exists', food: existing })
      }
    }

    const food = await fastify.prisma.food.create({
      data: { ...result.data, createdById: userId },
    })

    return reply.status(201).send(food)
  })

  // Update food (own foods only)
  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const food = await fastify.prisma.food.findFirst({
      where: { id, createdById: userId },
    })

    if (!food) {
      return reply.status(404).send({ error: 'Food not found or not owned by you' })
    }

    const body = request.body as Record<string, unknown>
    const updated = await fastify.prisma.food.update({
      where: { id },
      data: body,
    })

    return reply.send(updated)
  })

  // Delete food (own foods only)
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const food = await fastify.prisma.food.findFirst({
      where: { id, createdById: userId },
    })

    if (!food) {
      return reply.status(404).send({ error: 'Food not found or not owned by you' })
    }

    await fastify.prisma.food.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // Get recently used foods
  fastify.get('/recent/list', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    // Fetch more than needed then deduplicate in JS — avoids the slow
    // Prisma `distinct` subquery on an unindexed column combination.
    const entries = await fastify.prisma.mealEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        foodId: true,
        food: {
          select: {
            id: true, name: true, brand: true, calories: true,
            protein: true, carbs: true, fats: true,
            servingSize: true, servingUnit: true, imageUrl: true,
            isVerified: true, isPublic: true,
          },
        },
      },
    })

    const seen = new Set<string>()
    const foods = []
    for (const e of entries) {
      if (!seen.has(e.foodId) && foods.length < 20) {
        seen.add(e.foodId)
        foods.push(e.food)
      }
    }
    return reply.send(foods)
  })

  // Get favorite foods
  fastify.get('/favorites/list', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const favorites = await fastify.prisma.favoriteFood.findMany({
      where: { userId },
      include: { food: true },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send(favorites.map((f) => ({ ...f.food, isFavorite: true })))
  })

  // Toggle favorite
  fastify.post('/:id/favorite', { preHandler: authenticate }, async (request, reply) => {
    const { id: foodId } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const existing = await fastify.prisma.favoriteFood.findUnique({
      where: { userId_foodId: { userId, foodId } },
    })

    if (existing) {
      await fastify.prisma.favoriteFood.delete({ where: { userId_foodId: { userId, foodId } } })
      return reply.send({ isFavorite: false })
    } else {
      await fastify.prisma.favoriteFood.create({ data: { userId, foodId } })
      return reply.send({ isFavorite: true })
    }
  })

  // AI estimate nutrition from name
  fastify.post('/ai-estimate', { preHandler: authenticate }, async (request, reply) => {
    const { name } = request.body as { name: string }
    if (!name) {
      return reply.status(400).send({ error: 'Missing food name' })
    }

    const estimation = await estimateFoodFromName(name)
    return reply.send({ name, ...estimation })
  })
}

export default foodsRoutes
