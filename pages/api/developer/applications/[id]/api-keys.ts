import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { applications, apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateJWT } from '@/lib/auth/middleware'
import { generateApiKey, generateApiKeyJWT } from '@/lib/auth/jwt'

/**
 * GET /api/developer/applications/[id]/api-keys
 * Get all API keys for a specific application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await authenticateJWT(request)
    if (authError) return authError
    
    const userId = (request as any).user.id
    const applicationId = params.id
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    if (application.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
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
    
    return NextResponse.json({
      success: true,
      apiKeys: keys
    })
    
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/developer/applications/[id]/api-keys
 * Create a new API key for an application
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await authenticateJWT(request)
    if (authError) return authError
    
    const userId = (request as any).user.id
    const applicationId = params.id
    const body = await request.json()
    const { name, expiresInDays, permissions } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    if (application.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
    // Generate API key
    const { key, hash, prefix } = generateApiKey()
    
    // Calculate expiration date
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null
    
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
    
    // Generate JWT token for the API key
    const token = generateApiKeyJWT({
      applicationId,
      userId,
      permissions: permissions || ['read:devices', 'write:devices']
    })
    
    return NextResponse.json({
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
    console.error('Create API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/developer/applications/[id]/api-keys/[keyId]
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; keyId: string } }
) {
  try {
    const authError = await authenticateJWT(request)
    if (authError) return authError
    
    const userId = (request as any).user.id
    const applicationId = params.id
    const keyId = params.keyId
    
    // Verify the application belongs to the user
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1)
    
    if (application.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
    // Update API key status to REVOKED
    await db.update(apiKeys)
      .set({ status: 'REVOKED', updatedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.applicationId, applicationId)))
    
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    })
    
  } catch (error) {
    console.error('Revoke API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
