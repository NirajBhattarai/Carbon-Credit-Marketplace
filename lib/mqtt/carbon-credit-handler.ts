import mqtt from 'mqtt';
import { IoTDataProcessor, IoTDataPayload } from '../services/iot-processor';
import { db, iotDevices } from '../db';
import { eq } from 'drizzle-orm';

interface MQTTCarbonCreditMessage {
  deviceId: string;
  payload: IoTDataPayload;
}

export class MQTTCarbonCreditHandler {
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to MQTT broker
   */
  private async connect(): Promise<void> {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

      this.client = mqtt.connect(brokerUrl, {
        clientId: `carbon-credit-handler-${Date.now()}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('MQTT Carbon Credit Handler connected');
        this.isConnected = true;
        this.subscribeToTopics();
      });

      this.client.on('error', error => {
        console.error('MQTT Carbon Credit Handler error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('MQTT Carbon Credit Handler disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('MQTT Carbon Credit Handler reconnecting...');
      });
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
    }
  }

  /**
   * Subscribe to carbon credit topics
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.isConnected) return;

    // Subscribe to carbon credit data topics
    const topics = [
      'carbon-credits/+/data', // carbon-credits/{deviceId}/data
      'iot/+/carbon-credits', // iot/{deviceId}/carbon-credits
      'devices/+/credits', // devices/{deviceId}/credits
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, error => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    });

    // Handle incoming messages
    this.client.on('message', async (topic, message) => {
      try {
        await this.handleMessage(topic, message.toString());
      } catch (error) {
        console.error('Error handling MQTT message:', error);
      }
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, message: string): Promise<void> {
    try {
      console.log(`Received message on topic ${topic}:`, message);

      // Parse the message
      const data = JSON.parse(message);

      // Extract device ID from topic or message
      const deviceId = this.extractDeviceId(topic, data);

      if (!deviceId) {
        console.error('Device ID not found in topic or message');
        return;
      }

      // Validate device exists in database
      const device = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceId, deviceId))
        .limit(1);

      if (device.length === 0) {
        console.error(`Device ${deviceId} not found in database`);
        return;
      }

      // Process different message formats
      if (this.isCarbonCreditFormat(data)) {
        await this.processCarbonCreditData(deviceId, data);
      } else if (this.isLegacyFormat(data)) {
        await this.processLegacyData(deviceId, data);
      } else {
        console.warn('Unknown message format:', data);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  }

  /**
   * Extract device ID from topic or message
   */
  private extractDeviceId(topic: string, data: any): string | null {
    // Try to get device ID from topic
    const topicParts = topic.split('/');
    if (topicParts.length >= 2) {
      return topicParts[1]; // Second part is usually device ID
    }

    // Try to get device ID from message data
    if (data.deviceId) {
      return data.deviceId;
    }

    if (data.device_id) {
      return data.device_id;
    }

    return null;
  }

  /**
   * Check if message is in carbon credit format: {"c":1810,"h":64,"cr":905.0,"e":12.8,"o":true,"t":452787}
   */
  private isCarbonCreditFormat(data: any): boolean {
    return (
      typeof data.c === 'number' &&
      typeof data.h === 'number' &&
      typeof data.cr === 'number' &&
      typeof data.e === 'number' &&
      typeof data.o === 'boolean' &&
      typeof data.t === 'number'
    );
  }

  /**
   * Check if message is in legacy format
   */
  private isLegacyFormat(data: any): boolean {
    return (
      typeof data.co2Value === 'number' && typeof data.energyValue === 'number'
    );
  }

  /**
   * Process carbon credit format data
   */
  private async processCarbonCreditData(
    deviceId: string,
    data: any
  ): Promise<void> {
    try {
      const payload: IoTDataPayload = {
        c: data.c, // credits
        h: data.h, // humidity
        cr: data.cr, // co2 reduced
        e: data.e, // energy saved
        o: data.o, // online status
        t: data.t, // timestamp
      };

      console.log(
        `Processing carbon credit data for device ${deviceId}:`,
        payload
      );

      // Process the IoT data and update user credits
      const processedData = await IoTDataProcessor.processIoTData(
        deviceId,
        payload
      );

      console.log(`Successfully processed carbon credit data:`, {
        deviceId,
        credits: processedData.credits,
        co2Reduced: processedData.co2Reduced,
        energySaved: processedData.energySaved,
        isOnline: processedData.isOnline,
      });

      // Publish success message
      this.publishSuccess(deviceId, processedData);
    } catch (error) {
      console.error(
        `Error processing carbon credit data for device ${deviceId}:`,
        error
      );
      this.publishError(deviceId, error);
    }
  }

  /**
   * Process legacy format data
   */
  private async processLegacyData(deviceId: string, data: any): Promise<void> {
    try {
      // Convert legacy format to carbon credit format
      const payload: IoTDataPayload = {
        c: 0, // No credits in legacy format
        h: data.humidity || 50,
        cr: data.co2Value || 0,
        e: data.energyValue || 0,
        o: true, // Assume online for legacy data
        t: Math.floor(Date.now() / 1000),
      };

      console.log(`Processing legacy data for device ${deviceId}:`, payload);

      const processedData = await IoTDataProcessor.processIoTData(
        deviceId,
        payload
      );

      console.log(`Successfully processed legacy data:`, {
        deviceId,
        co2Reduced: processedData.co2Reduced,
        energySaved: processedData.energySaved,
      });
    } catch (error) {
      console.error(
        `Error processing legacy data for device ${deviceId}:`,
        error
      );
    }
  }

  /**
   * Publish success message
   */
  private publishSuccess(deviceId: string, processedData: any): void {
    if (!this.client || !this.isConnected) return;

    const successMessage = {
      deviceId,
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        credits: processedData.credits,
        co2Reduced: processedData.co2Reduced,
        energySaved: processedData.energySaved,
        isOnline: processedData.isOnline,
      },
    };

    this.client.publish(
      `carbon-credits/${deviceId}/status`,
      JSON.stringify(successMessage),
      { qos: 1 }
    );
  }

  /**
   * Publish error message
   */
  private publishError(deviceId: string, error: any): void {
    if (!this.client || !this.isConnected) return;

    const errorMessage = {
      deviceId,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error',
    };

    this.client.publish(
      `carbon-credits/${deviceId}/error`,
      JSON.stringify(errorMessage),
      { qos: 1 }
    );
  }

  /**
   * Publish test message
   */
  public publishTestMessage(deviceId: string): void {
    if (!this.client || !this.isConnected) return;

    const testMessage = {
      c: 100, // credits
      h: 65, // humidity
      cr: 50.5, // co2 reduced
      e: 12.8, // energy saved
      o: true, // online
      t: Math.floor(Date.now() / 1000), // timestamp
    };

    this.client.publish(
      `carbon-credits/${deviceId}/data`,
      JSON.stringify(testMessage),
      { qos: 1 }
    );

    console.log(`Published test message for device ${deviceId}:`, testMessage);
  }

  /**
   * Disconnect from MQTT broker
   */
  public disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mqttCarbonCreditHandler = new MQTTCarbonCreditHandler();
