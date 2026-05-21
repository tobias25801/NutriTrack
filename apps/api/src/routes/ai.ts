import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate, getUser } from '../middleware/auth'
import { analyzeMealImage, generateMealPlan, getAITip, chatWithCoach } from '../services/openai'
import { unlockAchievement, awardXP } from '../services/gamification'

const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Analyze meal photo
  fastify.post('/analyze-meal', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { imageBase64, imageUrl, description } = request.body as {
      imageBase64?: string
      imageUrl?: string
      description?: string
    }

    if (!imageBase64 && !imageUrl) {
      return reply.status(400).send({ error: 'Either imageBase64 or imageUrl is required' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return reply.status(503).send({ error: 'AI service not configured' })
    }

    try {
      let base64 = imageBase64
      if (!base64 && imageUrl) {
        const response = await fetch(imageUrl)
        const buffer = await response.arrayBuffer()
        base64 = Buffer.from(buffer).toString('base64')
      }

      const analysis = await analyzeMealImage(base64!)

      await fastify.prisma.aIAnalysis.create({
        data: {
          userId,
          imageUrl,
          response: analysis as any,
          type: 'meal-analysis',
        },
      })

      await unlockAchievement(fastify.prisma, userId, 'ai_explorer')
      await awardXP(fastify.prisma, userId, 15, 'ai_meal_analysis')

      return reply.send(analysis)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to analyze meal', message: error.message })
    }
  })

  // Generate meal plan
  fastify.post('/generate-plan', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const body = request.body as {
      age: number
      height: number
      weight: number
      gender: string
      goal: string
      activityLevel: string
      dietaryPreferences?: string[]
      allergies?: string[]
      budget?: string
      days?: number
    }

    if (!body.age || !body.height || !body.weight || !body.gender || !body.goal) {
      return reply.status(400).send({ error: 'Missing required fields: age, height, weight, gender, goal' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return reply.status(503).send({ error: 'AI service not configured' })
    }

    try {
      const plan = await generateMealPlan(body)

      await fastify.prisma.aIAnalysis.create({
        data: {
          userId,
          response: plan as any,
          type: 'meal-plan',
          prompt: JSON.stringify(body),
        },
      })

      await awardXP(fastify.prisma, userId, 25, 'ai_plan_generated')

      return reply.send(plan)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to generate meal plan', message: error.message })
    }
  })

  // Get daily AI tip
  fastify.get('/tip', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    if (!process.env.OPENAI_API_KEY) {
      return reply.send({ tip: 'Stay consistent with your nutrition tracking for the best results! 💪' })
    }

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { goal: true, streak: true, dailyCalories: true },
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayEntries = await fastify.prisma.mealEntry.findMany({
        where: { userId, date: { gte: today, lt: tomorrow } },
      })

      const todayCalories = todayEntries.reduce((acc, e) => acc + e.calories, 0)

      const tip = await getAITip({
        goal: user?.goal || 'MAINTAIN',
        streak: user?.streak || 0,
        todayCalories: Math.round(todayCalories),
        dailyGoal: user?.dailyCalories || 2000,
      })

      return reply.send({ tip })
    } catch (error: any) {
      return reply.send({ tip: 'Stay hydrated! Drinking enough water supports metabolism and energy levels.' })
    }
  })

  // AI Coach chat
  fastify.post('/chat', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { messages, context } = request.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      context?: { todayCalories?: number; dailyGoal?: number; weight?: number; goal?: string }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({ error: 'Messages array is required' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return reply.status(503).send({ error: 'AI service not configured' })
    }

    try {
      const response = await chatWithCoach(messages, context)
      return reply.send({ message: response })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to get AI response', message: error.message })
    }
  })

  // Get past AI analyses
  fastify.get('/history', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { type, limit = '10' } = request.query as { type?: string; limit?: string }

    const analyses = await fastify.prisma.aIAnalysis.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })

    return reply.send(analyses)
  })
}

export default aiRoutes
