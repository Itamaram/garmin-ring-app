#!/usr/bin/env node

/**
 * Generate a shared secret for signing requests between Garmin watch and server
 * This script generates a cryptographically secure random secret and saves it to config
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config.json');

function generateSecret() {
  // Generate 32 bytes (256 bits) of random data
  const secret = crypto.randomBytes(32).toString('hex');

  let config = {};

  // Load existing config if it exists
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      config = JSON.parse(data);
    } catch (error) {
      console.error('Error reading existing config:', error.message);
    }
  }

  // Update config with new secret
  config.sharedSecret = secret;

  // Save config
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✓ Shared secret generated successfully!');
    console.log('\nIMPORTANT: Save this secret for your Garmin watch app configuration:');
    console.log('─'.repeat(70));
    console.log(secret);
    console.log('─'.repeat(70));
    console.log('\nThis secret is also saved in config.json');
  } catch (error) {
    console.error('✗ Error saving config:', error.message);
    console.log('\nGenerated secret (save manually):');
    console.log(secret);
    process.exit(1);
  }
}

generateSecret();
