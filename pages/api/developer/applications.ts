import { NextApiRequest, NextApiResponse } from 'next'
// import { db } from '@/lib/db'
// import { applications, apiKeys } from '@/lib/db/schema'
// import { eq, and } from 'drizzle-orm'
import { authenticateJWT, requireDeveloper } from '@/lib/auth/middleware-pages'
// import { generateApiKey, generateApiKeyJWT } from '@/lib/auth/jwt'

/**
 * GET /api/developer/applications
 * Get all applications for the authenticated user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const authError = await authenticateJWT(req)
      if (authError) return res.status(authError.status).json(authError.body)
      
      const userId = (req as any).user.id
      
      // For now, return mock data instead of database query
      const mockApplications = [
        {
          id: 'app_1',
          name: 'Test Application',
          description: 'A test application for IoT devices',
          website: 'https://example.com',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      return res.status(200).json({
        success: true,
        applications: mockApplications
      })
      
    } catch (error) {
      console.error('Get applications error:', error)
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }
  
  if (req.method === 'POST') {
    try {
      const authError = await authenticateJWT(req)
      if (authError) return res.status(authError.status).json(authError.body)
      
      const userId = (req as any).user.id
      const { name, description, website } = req.body
      
      if (!name) {
        return res.status(400).json({
          error: 'Application name is required'
        })
      }
      
      // For now, return mock data instead of database insert
      const mockApplication = {
        id: `app_${Date.now()}`,
        userId,
        name,
        description: description || null,
        website: website || null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return res.status(200).json({
        success: true,
        application: mockApplication
      })
      
    } catch (error) {
      console.error('Create application error:', error)
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
