import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-prod')
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change')

export async function signAccessToken(payload: { sub: string; email: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET)
}

export async function signRefreshToken(userId: string) {
  const token = crypto.randomBytes(64).toString('hex')
  return token
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as { sub: string; email: string; username: string }
}
