import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface Config {
  refreshToken?: string;
  sharedSecret?: string;
  selectedDeviceId?: string;
  selectedDeviceName?: string;
  port?: number;
}

const CONFIG_FILE = path.join(__dirname, '../config.json');
const DEFAULT_CONFIG: Config = {
  port: 3000
};

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.load();
  }

  /**
   * Load configuration from disk, or create default if not exists
   */
  private load(): Config {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save configuration to disk
   */
  private save(): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  /**
   * Get the full configuration
   */
  getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | undefined {
    return this.config.refreshToken;
  }

  /**
   * Set refresh token and save
   */
  setRefreshToken(token: string): void {
    this.config.refreshToken = token;
    this.save();
  }

  /**
   * Get shared secret for request signing
   */
  getSharedSecret(): string | undefined {
    return this.config.sharedSecret;
  }

  /**
   * Generate a new shared secret
   */
  generateSharedSecret(): string {
    const secret = crypto.randomBytes(32).toString('hex');
    this.config.sharedSecret = secret;
    this.save();
    return secret;
  }

  /**
   * Set shared secret manually
   */
  setSharedSecret(secret: string): void {
    this.config.sharedSecret = secret;
    this.save();
  }

  /**
   * Get selected device ID
   */
  getSelectedDevice(): { id?: string; name?: string } {
    return {
      id: this.config.selectedDeviceId,
      name: this.config.selectedDeviceName
    };
  }

  /**
   * Set selected device
   */
  setSelectedDevice(deviceId: string, deviceName: string): void {
    this.config.selectedDeviceId = deviceId;
    this.config.selectedDeviceName = deviceName;
    this.save();
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.config.port || 3000;
  }

  /**
   * Check if configuration is complete
   */
  isConfigured(): boolean {
    return !!(
      this.config.refreshToken &&
      this.config.sharedSecret &&
      this.config.selectedDeviceId
    );
  }

  /**
   * Get missing configuration items
   */
  getMissingConfig(): string[] {
    const missing: string[] = [];
    if (!this.config.refreshToken) missing.push('refreshToken');
    if (!this.config.sharedSecret) missing.push('sharedSecret');
    if (!this.config.selectedDeviceId) missing.push('selectedDevice');
    return missing;
  }
}

// Singleton instance
export const configManager = new ConfigManager();
