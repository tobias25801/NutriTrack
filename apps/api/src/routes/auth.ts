import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { hashPassword, comparePassword, validatePassword } from '../utils/password'
import { signAccessToken, signRefreshToken } from '../utils/jwt'
import { authenticate, getUser } from '../middleware/auth'
import { awardXP } from '../services/gamification'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const result = registerSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const { email, username, password } = result.data

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return reply.status(400).send({ error: passwordValidation.message })
    }

    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return reply.status(409).send({
        error: existing.email === email ? 'Email already registered' : 'Username already taken',
      })
    }

    const passwordHash = await hashPassword(password)
    const user = await fastify.prisma.user.create({
      data: { email, username, passwordHash },
    })

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, username: user.username })
    const refreshToken = await signRefreshToken(user.id)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.status(201).send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
      },
    })
  })

  // Login
  fastify.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation error', details: result.error.issues })
    }

    const { email, password } = result.data

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, username: user.username })
    const refreshToken = await signRefreshToken(user.id)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        goal: user.goal,
        dailyCalories: user.dailyCalories,
        dailyProtein: user.dailyProtein,
        dailyCarbs: user.dailyCarbs,
        dailyFat: user.dailyFat,
        weight: user.weight,
        height: user.height,
        avatarUrl: user.avatarUrl,
      },
    })
  })

  // Google Login
  fastify.post('/google-login', async (request, reply) => {
    const { idToken } = request.body as { idToken: string }
    if (!idToken) {
      return reply.status(400).send({ error: 'Missing idToken' })
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload?.email) {
        return reply.status(400).send({ error: 'Invalid Google token' })
      }

      let user = await fastify.prisma.user.findFirst({
        where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
      })

      if (!user) {
        const baseUsername = (payload.email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '_')
        let username = baseUsername
        let counter = 1
        while (await fastify.prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter++}`
        }

        user = await fastify.prisma.user.create({
          data: {
            email: payload.email,
            username,
            googleId: payload.sub,
            avatarUrl: payload.picture,
          },
        })
      } else if (!user.googleId) {
        user = await fastify.prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, avatarUrl: user.avatarUrl || payload.picture },
        })
      }

      const accessToken = await signAccessToken({ sub: user.id, email: user.email, username: user.username })
      const refreshToken = await signRefreshToken(user.id)

      await fastify.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      return reply.send({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          level: user.level,
          xp: user.xp,
          streak: user.streak,
          goal: user.goal,
          dailyCalories: user.dailyCalories,
          avatarUrl: user.avatarUrl,
        },
      })
    } catch {
      return reply.status(401).send({ error: 'Invalid Google token' })
    }
  })

  // Refresh Token
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }
    if (!refreshToken) {
      return reply.status(400).send({ error: 'Missing refreshToken' })
    }

    const tokenRecord = await fastify.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' })
    }

    const accessToken = await signAccessToken({
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      username: tokenRecord.user.username,
    })

    return reply.send({ accessToken })
  })

  // Logout
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string }
    if (refreshToken) {
      await fastify.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    return reply.send({ success: true })
  })

  // Get current user
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { sub } = getUser(request)

    const user = await fastify.prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true,
        email: true,
        username: true,
        weight: true,
        height: true,
        age: true,
        gender: true,
        goal: true,
        activityLevel: true,
        dailyCalories: true,
        dailyProtein: true,
        dailyCarbs: true,
        dailyFat: true,
        dailyWater: true,
        dailySteps: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streak: true,
        lastLogDate: true,
        units: true,
        timezone: true,
        notifications: true,
        theme: true,
        createdAt: true,
        _count: {
          select: {
            achievements: true,
            mealEntries: true,
            friendships: true,
          },
        },
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return reply.send(user)
  })

  // Update profile
  fastify.put('/me', { preHandler: authenticate }, async (request, reply) => {
    const { sub } = getUser(request)
    const body = request.body as Record<string, unknown>

    const allowed = [
      'username', 'weight', 'height', 'age', 'gender', 'goal', 'activityLevel',
      'dailyCalories', 'dailyProtein', 'dailyCarbs', 'dailyFat', 'dailyWater',
      'dailySteps', 'units', 'timezone', 'notifications', 'theme', 'avatarUrl',
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updateData[key] = body[key]
    }

    if (updateData.username) {
      const existingUser = await fastify.prisma.user.findFirst({
        where: { username: updateData.username as string, NOT: { id: sub } },
      })
      if (existingUser) {
        return reply.status(409).send({ error: 'Username already taken' })
      }
    }

    const user = await fastify.prisma.user.update({
      where: { id: sub },
      data: updateData,
    })

    return reply.send({ success: true, user })
  })
}

export default authRoutes
