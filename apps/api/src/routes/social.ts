import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate, getUser } from '../middleware/auth'
import { unlockAchievement } from '../services/gamification'

const socialRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Search users
  fastify.get('/users/search', { preHandler: authenticate }, async (request, reply) => {
    const { q } = request.query as { q: string }
    const { sub: userId } = getUser(request)

    if (!q || q.length < 2) {
      return reply.status(400).send({ error: 'Search query must be at least 2 characters' })
    }

    const users = await fastify.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: userId },
      },
      select: { id: true, username: true, avatarUrl: true, level: true, streak: true },
      take: 10,
    })

    return reply.send(users)
  })

  // Get friends list
  fastify.get('/friends', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const friendships = await fastify.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, level: true, streak: true } },
        friend: { select: { id: true, username: true, avatarUrl: true, level: true, streak: true } },
      },
    })

    const friends = friendships.map((f) => (f.userId === userId ? f.friend : f.user))
    return reply.send(friends)
  })

  // Get pending friend requests
  fastify.get('/friends/requests', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)

    const requests = await fastify.prisma.friendship.findMany({
      where: { friendId: userId, status: 'PENDING' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, level: true } },
      },
    })

    return reply.send(requests)
  })

  // Send friend request
  fastify.post('/friends/request', { preHandler: authenticate }, async (request, reply) => {
    const { sub: userId } = getUser(request)
    const { friendId } = request.body as { friendId: string }

    if (!friendId) return reply.status(400).send({ error: 'friendId is required' })
    if (friendId === userId) return reply.status(400).send({ error: 'Cannot add yourself' })

    const friend = await fastify.prisma.user.findUnique({ where: { id: friendId } })
    if (!friend) return reply.status(404).send({ error: 'User not found' })

    const existing = await fastify.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    if (existing) {
      return reply.status(409).send({ error: 'Friendship already exists or request pending' })
    }

    const friendship = await fastify.prisma.friendship.create({
      data: { userId, friendId, status: 'PENDING' },
    })

    return reply.status(201).send(friendship)
  })

  // Accept friend request
  fastify.put('/friends/request/:id/accept', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const friendship = await fastify.prisma.friendship.findFirst({
      where: { id, friendId: userId, status: 'PENDING' },
    })

    if (!friendship) {
      return reply.status(404).send({ error: 'Friend request not found' })
    }

    const updated = await fastify.prisma.friendship.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    })

    // Check social achievement
    const friendCount = await fastify.prisma.friendship.count({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
    })

    if (friendCount >= 5) {
      await unlockAchievement(fastify.prisma, userId, 'social_butterfly')
    }

    return reply.send(updated)
  })

  // Decline/remove friend
  fastify.delete('/friends/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: userId } = getUser(request)

    const friendship = await fastify.prisma.friendship.findFirst({
      where: {
        id,
        OR: [{ userId }, { friendId: userId }],
      },
    })

    if (!friendship) {
      return reply.status(404).send({ error: 'Friendship not found' })
    }

    await fastify.prisma.friendship.delete({ where: { id } })
    return reply.send({ success: true })
  })
}

export default socialRoutes
