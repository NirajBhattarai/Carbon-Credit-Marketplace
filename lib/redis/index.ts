import Redis from 'ioredis'

// Redis client configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// Redis key patterns
export const REDIS_KEYS = {
  USER_CREDITS: (userId: string) => `user:${userId}:credits`,
  USER_DASHBOARD: (userId: string) => `user:${userId}:dashboard`,
  USER_HISTORY: (userId: string) => `user:${userId}:history`,
  CREDITS_LEADERBOARD: 'leaderboard:credits',
  GLOBAL_STATS: 'global:stats',
} as const

// Carbon credit data interface
export interface CarbonCreditData {
  credits: number
  co2Reduced: number
  energySaved: number
  temperatureImpact: number
  humidityImpact: number
  isOnline: boolean
  timestamp: string
}

// Dashboard data interface
export interface DashboardData {
  totalCredits: number
  totalCo2Reduced: number
  totalEnergySaved: number
  averageTemperatureImpact: number
  averageHumidityImpact: number
  onlineStatus: boolean
  lastUpdated: string
  recentHistory: Array<{
    creditsEarned: number
    co2Reduced: number
    energySaved: number
    source: string
    timestamp: string
  }>
}

// Redis service class
export class RedisService {
  /**
   * Cache user carbon credits data
   */
  static async cacheUserCredits(userId: string, data: CarbonCreditData): Promise<void> {
    const key = REDIS_KEYS.USER_CREDITS(userId)
    await redis.hset(key, {
      credits: data.credits.toString(),
      co2Reduced: data.co2Reduced.toString(),
      energySaved: data.energySaved.toString(),
      temperatureImpact: data.temperatureImpact.toString(),
      humidityImpact: data.humidityImpact.toString(),
      isOnline: data.isOnline.toString(),
      timestamp: data.timestamp,
    })
    // Set expiration to 1 hour
    await redis.expire(key, 3600)
  }

  /**
   * Get user carbon credits from cache
   */
  static async getUserCredits(userId: string): Promise<CarbonCreditData | null> {
    const key = REDIS_KEYS.USER_CREDITS(userId)
    const data = await redis.hgetall(key)
    
    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      credits: parseFloat(data.credits),
      co2Reduced: parseFloat(data.co2Reduced),
      energySaved: parseFloat(data.energySaved),
      temperatureImpact: parseFloat(data.temperatureImpact),
      humidityImpact: parseFloat(data.humidityImpact),
      isOnline: data.isOnline === 'true',
      timestamp: data.timestamp,
    }
  }

  /**
   * Cache user dashboard data
   */
  static async cacheUserDashboard(userId: string, data: DashboardData): Promise<void> {
    const key = REDIS_KEYS.USER_DASHBOARD(userId)
    await redis.setex(key, 1800, JSON.stringify(data)) // 30 minutes cache
  }

  /**
   * Get user dashboard data from cache
   */
  static async getUserDashboard(userId: string): Promise<DashboardData | null> {
    const key = REDIS_KEYS.USER_DASHBOARD(userId)
    const data = await redis.get(key)
    
    if (!data) {
      return null
    }

    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing dashboard data from Redis:', error)
      return null
    }
  }

  /**
   * Add credit history entry
   */
  static async addCreditHistory(userId: string, entry: {
    creditsEarned: number
    co2Reduced: number
    energySaved: number
    temperatureImpact: number
    humidityImpact: number
    source: string
    sourceId?: string
    timestamp: string
  }): Promise<void> {
    const key = REDIS_KEYS.USER_HISTORY(userId)
    const historyEntry = JSON.stringify(entry)
    
    // Add to list (most recent first)
    await redis.lpush(key, historyEntry)
    
    // Keep only last 100 entries
    await redis.ltrim(key, 0, 99)
    
    // Set expiration to 24 hours
    await redis.expire(key, 86400)
  }

  /**
   * Get user credit history
   */
  static async getUserCreditHistory(userId: string, limit: number = 20): Promise<any[]> {
    const key = REDIS_KEYS.USER_HISTORY(userId)
    const entries = await redis.lrange(key, 0, limit - 1)
    
    return entries.map(entry => {
      try {
        return JSON.parse(entry)
      } catch (error) {
        console.error('Error parsing history entry:', error)
        return null
      }
    }).filter(Boolean)
  }

  /**
   * Update leaderboard
   */
  static async updateLeaderboard(userId: string, credits: number): Promise<void> {
    const key = REDIS_KEYS.CREDITS_LEADERBOARD
    await redis.zadd(key, credits, userId)
    
    // Keep only top 100 users
    await redis.zremrangebyrank(key, 0, -101)
    
    // Set expiration to 1 hour
    await redis.expire(key, 3600)
  }

  /**
   * Get top users from leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; credits: number }>> {
    const key = REDIS_KEYS.CREDITS_LEADERBOARD
    const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES')
    
    const leaderboard: Array<{ userId: string; credits: number }> = []
    
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        credits: parseFloat(results[i + 1]),
      })
    }
    
    return leaderboard
  }

  /**
   * Update global statistics
   */
  static async updateGlobalStats(stats: {
    totalUsers: number
    totalCredits: number
    totalCo2Reduced: number
    totalEnergySaved: number
  }): Promise<void> {
    const key = REDIS_KEYS.GLOBAL_STATS
    await redis.hset(key, {
      totalUsers: stats.totalUsers.toString(),
      totalCredits: stats.totalCredits.toString(),
      totalCo2Reduced: stats.totalCo2Reduced.toString(),
      totalEnergySaved: stats.totalEnergySaved.toString(),
      lastUpdated: new Date().toISOString(),
    })
    
    // Set expiration to 1 hour
    await redis.expire(key, 3600)
  }

  /**
   * Get global statistics
   */
  static async getGlobalStats(): Promise<any | null> {
    const key = REDIS_KEYS.GLOBAL_STATS
    const data = await redis.hgetall(key)
    
    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      totalUsers: parseInt(data.totalUsers),
      totalCredits: parseFloat(data.totalCredits),
      totalCo2Reduced: parseFloat(data.totalCo2Reduced),
      totalEnergySaved: parseFloat(data.totalEnergySaved),
      lastUpdated: data.lastUpdated,
    }
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      REDIS_KEYS.USER_CREDITS(userId),
      REDIS_KEYS.USER_DASHBOARD(userId),
      REDIS_KEYS.USER_HISTORY(userId),
    ]
    
    await Promise.all(keys.map(key => redis.del(key)))
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    await redis.flushdb()
  }
}

export default redis
