import Fastify from 'fastify'
import { app } from './app'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss Z' },
          },
        }
      : {}),
  },
  trustProxy: true,
})

const start = async () => {
  try {
    await server.register(app)
    const port = Number(process.env.PORT) || 3001
    const host = process.env.HOST || '0.0.0.0'
    await server.listen({ port, host })
    console.log(`\n🚀 NutriTrack API running at http://${host}:${port}`)
    console.log(`📚 Health check: http://${host}:${port}/health\n`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  await server.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await server.close()
  process.exit(0)
})

start()
