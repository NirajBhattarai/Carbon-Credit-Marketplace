import { NextApiRequest, NextApiResponse } from 'next'
import { db, applications, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { apiKey } = req.query

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' })
  }

  try {
    // Query database to get wallet address from API key
    const result = await db
      .select({
        walletAddress: users.walletAddress,
        username: users.username,
        applicationName: applications.name,
        applicationId: applications.id,
        userId: users.id
      })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.apiKey, apiKey))
      .limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'API key not found' 
      })
    }

    const { walletAddress, username, applicationName, applicationId, userId } = result[0]

    return res.status(200).json({
      success: true,
      data: {
        walletAddress,
        username,
        applicationName,
        applicationId,
        userId,
        apiKey
      }
    })

  } catch (error) {
    console.error('Error fetching wallet address:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}
