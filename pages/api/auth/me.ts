import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';

/**
 * GET /api/auth/me
 * Get current user information
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authError = await authenticateJWT(req);
    if (authError) return res.status(authError.status).json(authError.body);

    const user = (req as any).user;

    // For now, return mock user data based on the authenticated user
    // In a real implementation, you would fetch from database
    const mockUser = {
      id: user.id,
      walletAddress: user.walletAddress,
      username: `user_${user.walletAddress.slice(0, 8)}`,
      email: null,
      role: user.role,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      user: mockUser,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
