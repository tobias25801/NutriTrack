import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import foodsRoutes from './routes/foods'
import mealsRoutes from './routes/meals'
import weightRoutes from './routes/weight'
import waterRoutes from './routes/water'
import aiRoutes from './routes/ai'
import achievementsRoutes from './routes/achievements'
import socialRoutes from './routes/social'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export const app: FastifyPluginAsync = fp(async (fastify: FastifyInstance) => {
  // Prisma
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async () => { await prisma.$disconnect() })

  // CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:19006',
        'exp://localhost:19000',
      ]
      if (!origin || allowed.some((o) => origin.startsWith(o))) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Rate limiting
  await fastify.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  })

  // Multipart (file uploads)
  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  })

  // Content type parser for JSON
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
      done(null, JSON.parse(body as string))
    } catch (err: any) {
      err.statusCode = 400
      done(err, undefined)
    }
  })

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  // API Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(foodsRoutes, { prefix: '/api/foods' })
  await fastify.register(mealsRoutes, { prefix: '/api/meals' })
  await fastify.register(weightRoutes, { prefix: '/api/weight' })
  await fastify.register(waterRoutes, { prefix: '/api/water' })
  await fastify.register(aiRoutes, { prefix: '/api/ai' })
  await fastify.register(achievementsRoutes, { prefix: '/api/achievements' })
  await fastify.register(socialRoutes, { prefix: '/api/social' })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({ error: 'Not Found', path: request.url })
  })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    const statusCode = error.statusCode || 500
    reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    })
  })
})
