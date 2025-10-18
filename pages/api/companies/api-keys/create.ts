import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, company, iotKeys } from '@/lib/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * POST /api/companies/api-keys/create
 * Create a new API key for the user's company
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authError = await authenticateJWT(req);
    if (authError) return res.status(authError.status).json(authError.body);

    const user = (req as any).user;

    // Get user's company
    const userCompany = await db
      .select()
      .from(company)
      .where(eq(company.walletAddress, user.walletAddress))
      .limit(1);

    if (userCompany.length === 0) {
      return res.status(404).json({
        error: 'Company not found. Please create a company first.',
      });
    }

    const companyData = userCompany[0];

    // Generate API key
    const apiKey = `cc_${crypto.randomBytes(32).toString('hex')}`;

    // Create API key record
    const [newApiKey] = await db
      .insert(iotKeys)
      .values({
        companyId: companyData.companyId,
        keyValue: apiKey,
      })
      .returning();

    return res.status(201).json({
      success: true,
      apiKey: {
        id: newApiKey.keyId,
        key: apiKey,
        companyId: companyData.companyId,
        companyName: companyData.companyName,
        createdAt: new Date().toISOString(),
      },
      message: 'API key created successfully',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
