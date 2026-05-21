import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../utils/jwt'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verifyAccessToken(token)
    ;(request as any).user = payload
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' })
  }
}

export function getUser(request: FastifyRequest): { sub: string; email: string; username: string } {
  return (request as any).user
}
