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
    const { users } = await import('@/lib/db/schema');

    const userData = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, user.walletAddress))
      .limit(1);

    if (userData.length === 0) {
      // Create new user if doesn't exist
      const newUser = await db
        .insert(users)
        .values({
          walletAddress: user.walletAddress,
          username: `user_${user.walletAddress.slice(0, 8)}`,
          role: user.role || 'USER',
          isVerified: false,
          createdAt: new Date(),
        })
        .returning();

      return res.status(200).json({
        success: true,
        user: newUser[0],
      });
    }

    return res.status(200).json({
      success: true,
      user: userData[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
