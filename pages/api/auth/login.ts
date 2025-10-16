import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/auth/login
 * Authenticate user with wallet signature
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { walletAddress, signature, message, username, email } = req.body
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        error: 'Wallet address, signature, and message are required'
      })
    }
    
    // Check if user already exists
    let user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1)
    
    if (user.length === 0) {
      // Create new user
      const newUser = await db.insert(users).values({
        walletAddress,
        username: username || `user_${walletAddress.slice(0, 8)}`,
        email: email || null,
        role: 'USER',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
      
      user = newUser
    } else {
      // Update last seen timestamp
      await db.update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, user[0].id))
    }
    
    const userData = user[0]
    
    // Generate JWT token
    const { generateJWT } = await import('@/lib/auth/jwt')
    const token = generateJWT({
      userId: userData.id,
      walletAddress: userData.walletAddress,
      role: userData.role
    })
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.id,
        walletAddress: userData.walletAddress,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        isVerified: userData.isVerified
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}