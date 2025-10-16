import { NextApiRequest, NextApiResponse } from 'next'
import { verifyJWT, verifyApiKeyJWT, extractTokenFromHeader } from './jwt'
// import { db } from '@/lib/db'
// import { users, apiKeys, applications } from '@/lib/db/schema'
// import { eq, and } from 'drizzle-orm'

export interface AuthenticatedRequest extends NextApiRequest {
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
 * Middleware to authenticate JWT tokens for Pages Router
 */
export async function authenticateJWT(req: NextApiRequest): Promise<{ status: number; body: any } | null> {
  const authHeader = req.headers.authorization
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) {
    return {
      status: 401,
      body: { error: 'Authorization token required' }
    }
  }
  
  const payload = verifyJWT(token)
  if (!payload) {
    return {
      status: 401,
      body: { error: 'Invalid or expired token' }
    }
  }
  
  // For now, skip database verification and use payload directly
  // In a real implementation, you would verify user exists in database
  ;(req as AuthenticatedRequest).user = {
    id: payload.userId,
    walletAddress: payload.walletAddress,
    role: payload.role
  }
  
  return null
}

/**
 * Middleware to authenticate API keys for Pages Router
 */
export async function authenticateApiKey(req: NextApiRequest): Promise<{ status: number; body: any } | null> {
  const authHeader = req.headers.authorization
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) {
    return {
      status: 401,
      body: { error: 'API key required' }
    }
  }
  
  const payload = verifyApiKeyJWT(token)
  if (!payload) {
    return {
      status: 401,
      body: { error: 'Invalid or expired API key' }
    }
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
    return {
      status: 401,
      body: { error: 'API key not found' }
    }
  }
  
  const key = apiKey[0]
  
  // Check if API key is active
  if (key.status !== 'ACTIVE') {
    return {
      status: 401,
      body: { error: 'API key is not active' }
    }
  }
  
  // Check if API key is expired
  if (key.expiresAt && new Date() > key.expiresAt) {
    return {
      status: 401,
      body: { error: 'API key has expired' }
    }
  }
  
  // Check if application is active
  if (key.application.status !== 'ACTIVE') {
    return {
      status: 401,
      body: { error: 'Application is not active' }
    }
  }
  
  // Add application info to request
  ;(req as AuthenticatedRequest).application = {
    id: key.application.id,
    userId: key.application.userId,
    name: key.application.name
  }
  
  return null
}

/**
 * Middleware to require specific user roles for Pages Router
 */
export function requireRole(roles: string[]) {
  return async (req: NextApiRequest): Promise<{ status: number; body: any } | null> => {
    const authError = await authenticateJWT(req)
    if (authError) return authError
    
    const user = (req as AuthenticatedRequest).user
    if (!user || !roles.includes(user.role)) {
      return {
        status: 403,
        body: { error: 'Insufficient permissions' }
      }
    }
    
    return null
  }
}

/**
 * Middleware to require developer role for Pages Router
 */
export function requireDeveloper(req: NextApiRequest): Promise<{ status: number; body: any } | null> {
  return requireRole(['DEVELOPER', 'ADMIN'])(req)
}

/**
 * Middleware to require admin role for Pages Router
 */
export function requireAdmin(req: NextApiRequest): Promise<{ status: number; body: any } | null> {
  return requireRole(['ADMIN'])(req)
}

/**
 * Helper function to get authenticated user from request
 */
export function getAuthenticatedUser(req: NextApiRequest) {
  return (req as AuthenticatedRequest).user
}

/**
 * Helper function to get authenticated application from request
 */
export function getAuthenticatedApplication(req: NextApiRequest) {
  return (req as AuthenticatedRequest).application
}
