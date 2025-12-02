import express, { Request, Response } from 'express';
import { configManager } from './config';
import { ringClient } from './ring-client';
import { verifySignature, SignedRequest, generateTestSignature } from './auth-middleware';

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint - no authentication required
 */
app.get('/health', (req: Request, res: Response) => {
  const config = configManager.getConfig();
  const missing = configManager.getMissingConfig();

  res.json({
    status: 'ok',
    configured: configManager.isConfigured(),
    missing: missing.length > 0 ? missing : undefined,
    ringConnected: ringClient.isInitialized(),
    timestamp: Math.floor(Date.now() / 1000)
  });
});

/**
 * Device status endpoint - requires authentication
 */
app.post('/status', verifySignature, async (req: Request, res: Response) => {
  try {
    const status = await ringClient.getDeviceStatus();
    res.json({
      success: true,
      device: status
    });
  } catch (error: any) {
    console.error('Error getting device status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Action endpoint - requires authentication
 * Executes the specified action on the configured Ring device
 */
app.post('/action', verifySignature, async (req: Request, res: Response) => {
  const { action } = req.body as SignedRequest;

  try {
    const result = await ringClient.executeAction({ action: action as any });
    res.json(result);
  } catch (error: any) {
    console.error('Error executing action:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Test signature generation endpoint (for development)
 * Only available when NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  app.post('/test/signature', (req: Request, res: Response) => {
    const { action } = req.body;

    if (!action) {
      res.status(400).json({ error: 'Missing action parameter' });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateTestSignature(action, timestamp);

    res.json({
      action,
      timestamp,
      signature,
      message: 'Use this in your Garmin watch request'
    });
  });
}

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

/**
 * Initialize and start server
 */
async function startServer() {
  console.log('═'.repeat(70));
  console.log('Ring-Garmin Integration Server');
  console.log('═'.repeat(70));

  // Check configuration
  if (!configManager.isConfigured()) {
    console.error('\n✗ Server is not fully configured!');
    console.error('Missing:', configManager.getMissingConfig().join(', '));
    console.error('\nPlease complete setup:');
    console.error('1. node scripts/auth.js         - Authenticate with Ring');
    console.error('2. node scripts/select-device.js - Select device to control');
    console.error('3. node scripts/generate-secret.js - Generate shared secret');
    process.exit(1);
  }

  // Initialize Ring client
  try {
    await ringClient.initialize();
  } catch (error: any) {
    console.error('\n✗ Failed to initialize Ring client:', error.message);
    console.error('Please re-authenticate: node scripts/auth.js');
    process.exit(1);
  }

  // Start HTTP server
  const port = configManager.getPort();
  app.listen(port, () => {
    console.log('\n✓ Server started successfully!');
    console.log('─'.repeat(70));
    console.log(`Port: ${port}`);
    console.log(`Device: ${configManager.getSelectedDevice().name}`);
    console.log('─'.repeat(70));
    console.log('\nEndpoints:');
    console.log(`  GET  /health  - Health check`);
    console.log(`  POST /status  - Get device status (requires signature)`);
    console.log(`  POST /action  - Execute device action (requires signature)`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`  POST /test/signature - Generate test signature (dev only)`);
    }
    console.log('\n' + '═'.repeat(70));
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
