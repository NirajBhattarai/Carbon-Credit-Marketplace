import { NextApiRequest, NextApiResponse } from 'next';
import { db, usertable, company, companyCredit, iotKeys, device, deviceCreditHistory, creditHistory } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Companies API] Fetching all companies with new schema');

    // Get all companies with their related data
    const companiesWithData = await db
      .select({
        companyId: company.companyId,
        companyName: company.companyName,
        address: company.address,
        website: company.website,
        location: company.location,
        walletAddress: company.walletAddress,
        totalCredit: companyCredit.totalCredit,
        currentCredit: companyCredit.currentCredit,
        soldCredit: companyCredit.soldCredit,
        offerPrice: companyCredit.offerPrice,
      })
      .from(company)
      .leftJoin(companyCredit, eq(company.companyId, companyCredit.companyId))
      .orderBy(desc(company.companyId));

    // Get IoT keys count for each company
    const iotKeysCount = await db
      .select({
        companyId: iotKeys.companyId,
        keyCount: sql<number>`count(*)`.as('keyCount'),
      })
      .from(iotKeys)
      .groupBy(iotKeys.companyId);

    // Get devices count for each company
    const devicesCount = await db
      .select({
        companyId: device.companyId,
        deviceCount: sql<number>`count(*)`.as('deviceCount'),
      })
      .from(device)
      .groupBy(device.companyId);

    // Get recent credit history for each company
    const recentCreditHistory = await db
      .select({
        companyId: creditHistory.companyId,
        soldAmount: creditHistory.soldAmount,
        soldPrice: creditHistory.soldPrice,
        buyerInfo: creditHistory.buyerInfo,
        saleDate: creditHistory.saleDate,
      })
      .from(creditHistory)
      .orderBy(desc(creditHistory.saleDate))
      .limit(10);

    // Combine all data
    const companies = companiesWithData.map(comp => {
      const keysCount = iotKeysCount.find(k => k.companyId === comp.companyId)?.keyCount || 0;
      const devCount = devicesCount.find(d => d.companyId === comp.companyId)?.deviceCount || 0;
      const recentSales = recentCreditHistory.filter(h => h.companyId === comp.companyId);

      return {
        companyId: comp.companyId,
        companyName: comp.companyName,
        address: comp.address,
        website: comp.website,
        location: comp.location,
        walletAddress: comp.walletAddress,
        credits: {
          total: parseFloat(comp.totalCredit || '0'),
          current: parseFloat(comp.currentCredit || '0'),
          sold: parseFloat(comp.soldCredit || '0'),
          offerPrice: parseFloat(comp.offerPrice || '0'),
        },
        stats: {
          iotKeys: keysCount,
          devices: devCount,
          recentSales: recentSales.length,
        },
        recentSales: recentSales.map(sale => ({
          amount: parseFloat(sale.soldAmount),
          price: parseFloat(sale.soldPrice),
          buyer: sale.buyerInfo,
          date: sale.saleDate,
        })),
      };
    });

    console.log(`[Companies API] Found ${companies.length} companies`);

    return res.status(200).json({
      success: true,
      companies,
      totalCompanies: companies.length,
      totalCredits: companies.reduce((sum, c) => sum + c.credits.total, 0),
      totalCurrentCredits: companies.reduce((sum, c) => sum + c.credits.current, 0),
      totalSoldCredits: companies.reduce((sum, c) => sum + c.credits.sold, 0),
    });

  } catch (error) {
    console.error('[Companies API] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
