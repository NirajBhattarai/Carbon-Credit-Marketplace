import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { eq } from 'drizzle-orm';

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

    // Fetch user data from database
    const { db } = await import('@/lib/db');
    const { usertable } = await import('@/lib/db/schema');

    const userData = await db
      .select()
      .from(usertable)
      .where(eq(usertable.walletAddress, user.walletAddress))
      .limit(1);

    if (userData.length === 0) {
      // Create new user if doesn't exist
      const newUser = await db
        .insert(usertable)
        .values({
          walletAddress: user.walletAddress,
        })
        .returning();

      return res.status(200).json({
        success: true,
        user: {
          id: newUser[0].walletAddress,
          walletAddress: newUser[0].walletAddress,
          username: `user_${user.walletAddress.slice(0, 8)}`,
          email: null,
          role: user.role || 'USER',
          isVerified: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: userData[0].walletAddress,
        walletAddress: userData[0].walletAddress,
        username: `user_${userData[0].walletAddress.slice(0, 8)}`,
        email: null,
        role: user.role || 'USER',
        isVerified: false,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
