import { SignJWT, jwtVerify } from 'jose'

let cachedSecret: Uint8Array | null = null

function getSecret() {
  if (cachedSecret) return cachedSecret
  const raw = process.env.JWT_SECRET
  if (!raw || !raw.trim()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'JWT_SECRET is missing; using an insecure development fallback. Set JWT_SECRET in .env.local for stable sessions.',
      )
      cachedSecret = new TextEncoder().encode('dev-insecure-jwt-secret')
      return cachedSecret
    }
    throw new Error('JWT_SECRET is missing. Set JWT_SECRET for the Next.js app runtime (e.g. .env.local on the VPS).')
  }
  cachedSecret = new TextEncoder().encode(raw)
  return cachedSecret
}

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}
