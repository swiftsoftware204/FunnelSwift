import { getCached, setCached } from '../../lib/redis'

export default async function handler(req, res) {
  try {
    // Test Redis connection
    await setCached('health-check', 'ok', 10)
    const redisStatus = await getCached('health-check')
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: redisStatus === 'ok' ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}