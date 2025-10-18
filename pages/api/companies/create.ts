import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, company, usertable } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/companies/create
 * Create a new company for the authenticated user
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
    const { companyName, address, website, location } = req.body;

    if (!companyName) {
      return res.status(400).json({
        error: 'Company name is required',
      });
    }

    // Check if user already has a company
    const existingCompany = await db
      .select()
      .from(company)
      .where(eq(company.walletAddress, user.walletAddress))
      .limit(1);

    if (existingCompany.length > 0) {
      return res.status(400).json({
        error: 'User already has a company',
        company: existingCompany[0],
      });
    }

    // Create new company
    const [newCompany] = await db
      .insert(company)
      .values({
        companyName,
        address: address || null,
        website: website || null,
        location: location || null,
        walletAddress: user.walletAddress,
      })
      .returning();

    return res.status(201).json({
      success: true,
      company: newCompany,
      message: 'Company created successfully',
    });
  } catch (error) {
    console.error('Create company error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
