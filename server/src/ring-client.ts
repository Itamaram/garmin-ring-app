import { RingApi, RingCamera, RingIntercom } from 'ring-client-api';
import { configManager } from './config';

export interface DeviceAction {
  action: 'unlock' | 'lock' | 'light_on' | 'light_off' | 'trigger_alarm';
  deviceId?: string;
}

export class RingClient {
  private api: RingApi | null = null;
  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize the Ring API client with the stored refresh token
   */
  async initialize(): Promise<void> {
    const refreshToken = configManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token found. Please run authentication script first.');
    }

    console.log('Initializing Ring API client...');

    this.api = new RingApi({
      refreshToken,
      // Critical: Subscribe to token updates to maintain push notifications
      onRefreshTokenUpdated: ({ newRefreshToken, oldRefreshToken }) => {
        console.log('Ring refresh token updated');
        configManager.setRefreshToken(newRefreshToken);
      }
    });

    // Verify connection by getting locations
    try {
      const locations = await this.api.getLocations();
      console.log(`✓ Connected to Ring API - ${locations.length} location(s) found`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to connect to Ring API:', error);
      throw new Error('Failed to initialize Ring API. Token may be invalid.');
    }
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.api !== null;
  }

  /**
   * Get the configured device
   */
  async getSelectedDevice(): Promise<RingCamera | RingIntercom | null> {
    if (!this.api) {
      throw new Error('Ring API not initialized');
    }

    const { id: deviceId } = configManager.getSelectedDevice();
    if (!deviceId) {
      throw new Error('No device selected. Please run select-device script.');
    }

    const locations = await this.api.getLocations();

    for (const location of locations) {
      // Check cameras/doorbells
      for (const camera of location.cameras) {
        if (camera.id.toString() === deviceId) {
          return camera;
        }
      }

      // Check intercoms
      const intercoms = location.intercoms || [];
      for (const intercom of intercoms) {
        if (intercom.id.toString() === deviceId) {
          return intercom;
        }
      }
    }

    return null;
  }

  /**
   * Execute an action on the selected device
   */
  async executeAction(action: DeviceAction): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized()) {
      throw new Error('Ring API not initialized');
    }

    const device = await this.getSelectedDevice();
    if (!device) {
      throw new Error('Selected device not found');
    }

    console.log(`Executing action: ${action.action} on device: ${configManager.getSelectedDevice().name}`);

    try {
      switch (action.action) {
        case 'unlock':
          // For intercoms, unlock the door
          if ('unlock' in device && typeof device.unlock === 'function') {
            await device.unlock();
            return { success: true, message: 'Door unlocked successfully' };
          } else {
            return { success: false, message: 'Device does not support unlock' };
          }

        case 'lock':
          // For smart locks
          if ('lock' in device && typeof device.lock === 'function') {
            await device.lock();
            return { success: true, message: 'Door locked successfully' };
          } else {
            return { success: false, message: 'Device does not support lock' };
          }

        case 'light_on':
          // For cameras with lights
          if ('setLight' in device && typeof device.setLight === 'function') {
            await device.setLight(true);
            return { success: true, message: 'Light turned on successfully' };
          } else {
            return { success: false, message: 'Device does not have controllable lights' };
          }

        case 'light_off':
          // For cameras with lights
          if ('setLight' in device && typeof device.setLight === 'function') {
            await device.setLight(false);
            return { success: true, message: 'Light turned off successfully' };
          } else {
            return { success: false, message: 'Device does not have controllable lights' };
          }

        case 'trigger_alarm':
          // For alarm systems
          if ('setAlarmMode' in device && typeof device.setAlarmMode === 'function') {
            // This would need proper implementation based on your needs
            return { success: false, message: 'Alarm trigger not implemented' };
          } else {
            return { success: false, message: 'Device does not support alarm control' };
          }

        default:
          return { success: false, message: `Unknown action: ${action.action}` };
      }
    } catch (error: any) {
      console.error('Error executing action:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  /**
   * Get device status information
   */
  async getDeviceStatus(): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error('Ring API not initialized');
    }

    const device = await this.getSelectedDevice();
    if (!device) {
      throw new Error('Selected device not found');
    }

    const { name } = configManager.getSelectedDevice();

    return {
      name,
      id: device.id,
      available: true,
      batteryLevel: 'batteryLevel' in device ? device.batteryLevel : undefined,
      // Add more status fields as needed
    };
  }
}

// Singleton instance
export const ringClient = new RingClient();
