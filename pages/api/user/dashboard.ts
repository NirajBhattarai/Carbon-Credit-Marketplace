import { NextApiRequest, NextApiResponse } from 'next'
import { db, userCarbonCredits, userCreditHistory } from '../../../lib/db'
import { eq, desc, sum, avg, count } from 'drizzle-orm'
import { RedisService, DashboardData } from '../../../lib/redis'
import { authenticateJWT } from '../../../lib/auth/middleware'

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string
    walletAddress: string
  }
}

/**
 * GET /api/user/dashboard - Get user's dashboard data
 */
export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const authResult = await authenticateJWT(req)
    if (!authResult) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = req.user!.id

    // Try to get from Redis cache first
    const cachedDashboard = await RedisService.getUserDashboard(userId)
    if (cachedDashboard) {
      return res.status(200).json({
        success: true,
        data: cachedDashboard,
        cached: true,
      })
    }

    // If not in cache, build dashboard data from database
    const dashboardData = await buildDashboardData(userId)

    // Cache the dashboard data
    await RedisService.cacheUserDashboard(userId, dashboardData)

    res.status(200).json({
      success: true,
      data: dashboardData,
      cached: false,
    })
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Build dashboard data from database
 */
async function buildDashboardData(userId: string): Promise<DashboardData> {
  // Get latest user credits
  const latestCredits = await db
    .select()
    .from(userCarbonCredits)
    .where(eq(userCarbonCredits.userId, userId))
    .orderBy(desc(userCarbonCredits.updatedAt))
    .limit(1)

  // Get aggregated totals
  const totals = await db
    .select({
      totalCredits: sum(userCarbonCredits.credits),
      totalCo2Reduced: sum(userCarbonCredits.co2Reduced),
      totalEnergySaved: sum(userCarbonCredits.energySaved),
      avgTemperatureImpact: avg(userCarbonCredits.temperatureImpact),
      avgHumidityImpact: avg(userCarbonCredits.humidityImpact),
    })
    .from(userCarbonCredits)
    .where(eq(userCarbonCredits.userId, userId))

  // Get recent history (last 10 entries)
  const recentHistory = await db
    .select({
      creditsEarned: userCreditHistory.creditsEarned,
      co2Reduced: userCreditHistory.co2Reduced,
      energySaved: userCreditHistory.energySaved,
      source: userCreditHistory.source,
      createdAt: userCreditHistory.createdAt,
    })
    .from(userCreditHistory)
    .where(eq(userCreditHistory.userId, userId))
    .orderBy(desc(userCreditHistory.createdAt))
    .limit(10)

  const currentCredits = latestCredits[0]
  const totalsData = totals[0]

  const dashboardData: DashboardData = {
    totalCredits: parseFloat(totalsData.totalCredits || '0'),
    totalCo2Reduced: parseFloat(totalsData.totalCo2Reduced || '0'),
    totalEnergySaved: parseFloat(totalsData.totalEnergySaved || '0'),
    averageTemperatureImpact: parseFloat(totalsData.avgTemperatureImpact || '0'),
    averageHumidityImpact: parseFloat(totalsData.avgHumidityImpact || '0'),
    onlineStatus: currentCredits?.isOnline || false,
    lastUpdated: currentCredits?.updatedAt?.toISOString() || new Date().toISOString(),
    recentHistory: recentHistory.map(entry => ({
      creditsEarned: parseFloat(entry.creditsEarned),
      co2Reduced: parseFloat(entry.co2Reduced),
      energySaved: parseFloat(entry.energySaved),
      source: entry.source,
      timestamp: entry.createdAt.toISOString(),
    })),
  }

  return dashboardData
}
