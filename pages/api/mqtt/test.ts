import { NextApiRequest, NextApiResponse } from 'next'
import mqtt from 'mqtt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { topic, payload } = req.body

    if (!topic || !payload) {
      return res.status(400).json({ error: 'Topic and payload are required' })
    }

    // Connect to MQTT broker
    const client = mqtt.connect('mqtt://localhost:1883', {
      clientId: `test_api_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
    })

    return new Promise((resolve) => {
      client.on('connect', () => {
        console.log('Test API: Connected to MQTT broker')
        
        // Publish the message
        client.publish(topic, JSON.stringify(payload), (error) => {
          if (error) {
            console.error('Test API: Failed to publish message:', error)
            client.end()
            res.status(500).json({ error: 'Failed to publish MQTT message' })
            resolve(undefined)
          } else {
            console.log('Test API: Message published successfully')
            console.log(`Topic: ${topic}`)
            console.log(`Payload: ${JSON.stringify(payload)}`)
            
            client.end()
            res.status(200).json({ 
              success: true, 
              message: 'MQTT message sent successfully',
              topic,
              payload 
            })
            resolve(undefined)
          }
        })
      })

      client.on('error', (error) => {
        console.error('Test API: MQTT connection error:', error)
        res.status(500).json({ error: 'MQTT connection failed' })
        resolve(undefined)
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        client.end()
        res.status(500).json({ error: 'MQTT connection timeout' })
        resolve(undefined)
      }, 5000)
    })

  } catch (error) {
    console.error('Test API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
