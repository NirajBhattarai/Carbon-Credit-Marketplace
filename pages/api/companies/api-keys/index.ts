import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, company, iotKeys } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/companies/api-keys
 * Get all API keys for the user's company
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Get all API keys for this company
    const apiKeys = await db
      .select({
        keyId: iotKeys.keyId,
        keyValue: iotKeys.keyValue,
        companyId: iotKeys.companyId,
        companyName: company.companyName,
      })
      .from(iotKeys)
      .innerJoin(company, eq(iotKeys.companyId, company.companyId))
      .where(eq(iotKeys.companyId, companyData.companyId));

    return res.status(200).json({
      success: true,
      apiKeys: apiKeys.map(key => ({
        id: key.keyId,
        key: key.keyValue,
        companyId: key.companyId,
        companyName: key.companyName,
      })),
      company: {
        id: companyData.companyId,
        name: companyData.companyName,
        address: companyData.address,
        website: companyData.website,
        location: companyData.location,
        walletAddress: companyData.walletAddress,
      },
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
