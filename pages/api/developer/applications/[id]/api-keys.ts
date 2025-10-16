import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/db'
import { applications, apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateJWTPages } from '@/lib/auth/middleware'
import { generateApiKey, generateApiKeyJWT } from '@/lib/auth/jwt'

/**
 * API route handler for /api/developer/applications/[id]/api-keys
 * Supports GET, POST, and DELETE operations
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req
  const applicationId = query.id as string
  const keyId = query.keyId as string

  console.log(`[API Keys Handler] ${method} request to /api/developer/applications/${applicationId}/api-keys`)
  console.log(`[API Keys Handler] Query params:`, { applicationId, keyId })
  console.log(`[API Keys Handler] Headers:`, { 
    authorization: req.headers.authorization ? 'Bearer ***' : 'none',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  })

  try {
    // Authenticate the request
    console.log(`[API Keys Handler] Starting authentication...`)
    const authError = await authenticateJWTPages(req)
    if (authError) {
      console.log(`[API Keys Handler] Authentication failed:`, authError)
      return res.status(authError.status).json(authError.data)
    }
    
    const userId = (req as any).user.id
    console.log(`[API Keys Handler] Authentication successful for user:`, userId)

    switch (method) {
      case 'GET':
        console.log(`[API Keys Handler] Handling GET request for application:`, applicationId)
        return await handleGetApiKeys(req, res, applicationId, userId)
      
      case 'POST':
        console.log(`[API Keys Handler] Handling POST request for application:`, applicationId)
        console.log(`[API Keys Handler] Request body:`, req.body)
        return await handleCreateApiKey(req, res, applicationId, userId)
      
      case 'DELETE':
        console.log(`[API Keys Handler] Handling DELETE request for key:`, keyId)
        if (!keyId) {
          console.log(`[API Keys Handler] DELETE request missing keyId`)
          return res.status(400).json({ error: 'Key ID is required for deletion' })
        }
        return await handleDeleteApiKey(req, res, applicationId, keyId, userId)
      
      default:
        console.log(`[API Keys Handler] Unsupported method:`, method)
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error(`[API Keys Handler] Unexpected error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      method,
      applicationId,
      keyId,
      userId: (req as any).user?.id || 'unknown'
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * GET /api/developer/applications/[id]/api-keys
 * Get all API keys for a specific application
 */
async function handleGetApiKeys(
  req: NextApiRequest,
  res: NextApiResponse,
  applicationId: string,
  userId: string
) {
  try {
    console.log(`[Get API Keys] Looking up application ${applicationId} for user ${userId}`)
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    console.log(`[Get API Keys] Application query result:`, application.length > 0 ? 'found' : 'not found')
    
    if (application.length === 0) {
      console.log(`[Get API Keys] Application not found - ID: ${applicationId}, User: ${userId}`)
      return res.status(404).json({ error: 'Application not found' })
    }
    
    console.log(`[Get API Keys] Fetching API keys for application: ${applicationId}`)
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        status: apiKeys.status,
        lastUsed: apiKeys.lastUsed,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt
      })
      .from(apiKeys)
      .where(eq(apiKeys.applicationId, applicationId))
    
    console.log(`[Get API Keys] Found ${keys.length} API keys`)
    return res.status(200).json({
      success: true,
      apiKeys: keys
    })
    
  } catch (error) {
    console.error(`[Get API Keys] Error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId,
      userId
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/developer/applications/[id]/api-keys
 * Create a new API key for an application
 */
async function handleCreateApiKey(
  req: NextApiRequest,
  res: NextApiResponse,
  applicationId: string,
  userId: string
) {
  try {
    const { name, expiresInDays, permissions } = req.body
    
    console.log(`[Create API Key] Request data:`, { name, expiresInDays, permissions })
    
    if (!name) {
      console.log(`[Create API Key] Missing required field: name`)
      return res.status(400).json({ error: 'API key name is required' })
    }
    
    console.log(`[Create API Key] Looking up application ${applicationId} for user ${userId}`)
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    console.log(`[Create API Key] Application query result:`, application.length > 0 ? 'found' : 'not found')
    
    if (application.length === 0) {
      console.log(`[Create API Key] Application not found - ID: ${applicationId}, User: ${userId}`)
      return res.status(404).json({ error: 'Application not found' })
    }
    
    console.log(`[Create API Key] Generating API key...`)
    // Generate API key
    const { key, hash, prefix } = generateApiKey()
    
    // Calculate expiration date
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null
    
    console.log(`[Create API Key] Creating API key record in database...`)
    // Create API key record
    const newApiKey = await db.insert(apiKeys).values({
      applicationId,
      keyHash: hash,
      keyPrefix: prefix,
      name,
      status: 'ACTIVE',
      expiresAt,
      permissions: permissions || ['read:devices', 'write:devices']
    }).returning()
    
    console.log(`[Create API Key] API key created with ID: ${newApiKey[0].id}`)
    
    // Generate JWT token for the API key
    console.log(`[Create API Key] Generating JWT token...`)
    const token = generateApiKeyJWT({
      applicationId,
      userId,
      permissions: permissions || ['read:devices', 'write:devices']
    })
    
    console.log(`[Create API Key] Successfully created API key: ${newApiKey[0].id}`)
    return res.status(201).json({
      success: true,
      apiKey: {
        id: newApiKey[0].id,
        key,
        token,
        name: newApiKey[0].name,
        expiresAt: newApiKey[0].expiresAt,
        permissions: newApiKey[0].permissions
      }
    })
    
  } catch (error) {
    console.error(`[Create API Key] Error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId,
      userId,
      requestBody: req.body
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/developer/applications/[id]/api-keys/[keyId]
 * Revoke an API key
 */
async function handleDeleteApiKey(
  req: NextApiRequest,
  res: NextApiResponse,
  applicationId: string,
  keyId: string,
  userId: string
) {
  try {
    console.log(`[Delete API Key] Looking up application ${applicationId} for user ${userId}`)
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    console.log(`[Delete API Key] Application query result:`, application.length > 0 ? 'found' : 'not found')
    
    if (application.length === 0) {
      console.log(`[Delete API Key] Application not found - ID: ${applicationId}, User: ${userId}`)
      return res.status(404).json({ error: 'Application not found' })
    }
    
    console.log(`[Delete API Key] Revoking API key ${keyId} for application ${applicationId}`)
    
    // Update API key status to REVOKED
    const result = await db.update(apiKeys)
      .set({ status: 'REVOKED', updatedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.applicationId, applicationId)))
    
    console.log(`[Delete API Key] API key revocation result:`, result)
    
    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    })
    
  } catch (error) {
    console.error(`[Delete API Key] Error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId,
      keyId,
      userId
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
