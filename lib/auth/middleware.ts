import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, verifyApiKeyJWT, extractTokenFromHeader } from './jwt'
import { db } from '@/lib/db'
import { users, apiKeys, applications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    walletAddress: string
    role: string
  }
  application?: {
    id: string
    userId: string
    name: string
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateJWT(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader || undefined)
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authorization token required' },
      { status: 401 }
    )
  }
  
  const payload = verifyJWT(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
  
  // Verify user exists in database
  const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
  if (user.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    )
  }
  
  // Add user info to request
  ;(request as AuthenticatedRequest).user = {
    id: payload.userId,
    walletAddress: payload.walletAddress,
    role: payload.role
  }
  
  return null
}

/**
 * Middleware to authenticate API keys
 */
export async function authenticateApiKey(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader || undefined)
  
  if (!token) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    )
  }
  
  const payload = verifyApiKeyJWT(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401 }
    )
  }
  
  // Verify API key exists and is active
  const apiKey = await db
    .select({
      id: apiKeys.id,
      status: apiKeys.status,
      expiresAt: apiKeys.expiresAt,
      application: {
        id: applications.id,
        userId: applications.userId,
        name: applications.name,
        status: applications.status
      }
    })
    .from(apiKeys)
    .innerJoin(applications, eq(apiKeys.applicationId, applications.id))
    .where(eq(apiKeys.id, payload.applicationId))
    .limit(1)
  
  if (apiKey.length === 0) {
    return NextResponse.json(
      { error: 'API key not found' },
      { status: 401 }
    )
  }
  
  const key = apiKey[0]
  
  // Check if API key is active
  if (key.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'API key is not active' },
      { status: 401 }
    )
  }
  
  // Check if API key is expired
  if (key.expiresAt && new Date() > key.expiresAt) {
    return NextResponse.json(
      { error: 'API key has expired' },
      { status: 401 }
    )
  }
  
  // Check if application is active
  if (key.application.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Application is not active' },
      { status: 401 }
    )
  }
  
  // Add application info to request
  ;(request as AuthenticatedRequest).application = {
    id: key.application.id,
    userId: key.application.userId,
    name: key.application.name
  }
  
  return null
}

/**
 * Middleware to require specific user roles
 */
export function requireRole(roles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authError = await authenticateJWT(request)
    if (authError) return authError
    
    const user = (request as AuthenticatedRequest).user
    if (!user || !roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return null
  }
}

/**
 * Middleware to require developer role
 */
export function requireDeveloper(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(['DEVELOPER', 'ADMIN'])(request)
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(['ADMIN'])(request)
}

/**
 * Helper function to get authenticated user from request
 */
export function getAuthenticatedUser(request: NextRequest) {
  return (request as AuthenticatedRequest).user
}

/**
 * Helper function to get authenticated application from request
 */
export function getAuthenticatedApplication(request: NextRequest) {
  return (request as AuthenticatedRequest).application
}
