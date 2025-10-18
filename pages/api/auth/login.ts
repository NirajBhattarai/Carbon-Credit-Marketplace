import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { usertable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWalletSignature } from '@/lib/auth/jwt';

/**
 * POST /api/auth/login
 * Authenticate user with wallet signature
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { walletAddress, signature, message, username, email } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        error: 'Wallet address, signature, and message are required',
      });
    }

    // Verify the wallet signature
    const isValidSignature = verifyWalletSignature(
      message,
      signature,
      walletAddress
    );
    if (!isValidSignature) {
      return res.status(401).json({
        error: 'Invalid signature',
      });
    }

    // Check if user already exists
    let user = await db
      .select()
      .from(usertable)
      .where(eq(usertable.walletAddress, walletAddress))
      .limit(1);

    if (user.length === 0) {
      // Create new user
      const newUser = await db
        .insert(usertable)
        .values({
          walletAddress,
        })
        .returning();

      user = newUser;
    }

    const userData = user[0];

    // Generate JWT token
    const { generateJWT } = await import('@/lib/auth/jwt');
    const token = generateJWT({
      userId: userData.walletAddress, // Use walletAddress as userId since it's now the primary key
      walletAddress: userData.walletAddress,
      role: 'USER', // Default role since usertable doesn't store role
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.walletAddress, // Use walletAddress as id since it's now the primary key
        walletAddress: userData.walletAddress,
        username: username || `user_${walletAddress.slice(0, 8)}`, // Use provided username or generate one
        email: email || null, // Use provided email or null
        role: 'USER', // Default role
        isVerified: false, // Default verification status
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
