import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, company, companyCredit } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/companies/my-company
 * Get the authenticated user's company information
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
        needsCompany: true,
      });
    }

    const companyData = userCompany[0];

    // Get company credits if they exist
    const credits = await db
      .select()
      .from(companyCredit)
      .where(eq(companyCredit.companyId, companyData.companyId))
      .limit(1);

    const creditData = credits.length > 0 ? credits[0] : null;

    return res.status(200).json({
      success: true,
      company: {
        id: companyData.companyId,
        name: companyData.companyName,
        address: companyData.address,
        website: companyData.website,
        location: companyData.location,
        walletAddress: companyData.walletAddress,
        credits: creditData ? {
          totalCredit: parseFloat(creditData.totalCredit),
          currentCredit: parseFloat(creditData.currentCredit),
          soldCredit: parseFloat(creditData.soldCredit),
          offerPrice: creditData.offerPrice ? parseFloat(creditData.offerPrice) : null,
        } : {
          totalCredit: 0,
          currentCredit: 0,
          soldCredit: 0,
          offerPrice: null,
        },
      },
    });
  } catch (error) {
    console.error('Get company error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
