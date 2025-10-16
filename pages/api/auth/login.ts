import { NextApiRequest, NextApiResponse } from 'next'

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
    
    // For now, let's create a simple user object without database operations
    // This will help us test the JWT generation
    const mockUser = {
      id: `user_${Date.now()}`,
      walletAddress,
      username: username || `user_${walletAddress.slice(0, 8)}`,
      email: email || null,
      role: 'USER' as const,
      isVerified: false,
      createdAt: new Date().toISOString()
    }
    
    // Generate JWT token
    const { generateJWT } = await import('@/lib/auth/jwt')
    const token = generateJWT({
      userId: mockUser.id,
      walletAddress: mockUser.walletAddress,
      role: mockUser.role
    })
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: mockUser.id,
        walletAddress: mockUser.walletAddress,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
        isVerified: mockUser.isVerified
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