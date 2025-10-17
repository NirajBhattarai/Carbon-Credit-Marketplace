import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read aggregated data from file
    const dataPath = path.join(process.cwd(), 'aggregated-co2-data.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(200).json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          totalWallets: 0,
          totalCO2Processed: 0,
          totalCarbonCredits: 0,
          topSequesterers: [],
          topEmitters: [],
          walletStats: [],
          message:
            'No aggregated data available yet. Cron job may not have run.',
        },
      });
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const aggregatedData = JSON.parse(rawData);

    // Calculate additional statistics
    const stats = {
      ...aggregatedData,
      averageCO2PerWallet:
        aggregatedData.totalWallets > 0
          ? aggregatedData.totalCO2Processed / aggregatedData.totalWallets
          : 0,
      averageCreditsPerWallet:
        aggregatedData.totalWallets > 0
          ? aggregatedData.totalCarbonCredits / aggregatedData.totalWallets
          : 0,
      netSequesteringWallets: aggregatedData.walletStats.filter(
        (w: any) => w.netCO2Impact > 0
      ).length,
      netEmittingWallets: aggregatedData.walletStats.filter(
        (w: any) => w.netCO2Impact < 0
      ).length,
      neutralWallets: aggregatedData.walletStats.filter(
        (w: any) => w.netCO2Impact === 0
      ).length,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error reading aggregated data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read aggregated data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
