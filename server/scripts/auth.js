#!/usr/bin/env node

/**
 * Interactive authentication script for Ring
 * Prompts for username, password, and 2FA code
 * Saves refresh token to configuration
 */

const { RingApi } = require('ring-client-api');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    // Disable echo for password input
    rl.stdoutMuted = true;
    rl.question(prompt, (answer) => {
      rl.stdoutMuted = false;
      process.stdout.write('\n');
      resolve(answer);
    });
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    };
  });
}

async function authenticate() {
  console.log('═'.repeat(70));
  console.log('Ring Authentication Setup');
  console.log('═'.repeat(70));
  console.log('\nThis script will authenticate with Ring and save your refresh token.');
  console.log('You will need your Ring account credentials and 2FA code.\n');

  try {
    // Prompt for credentials
    const email = await question('Ring Email: ');
    const password = await questionHidden('Ring Password: ');

    console.log('\nAuthenticating with Ring...');

    let refreshToken;
    let authPromptSent = false;

    // Create Ring API instance with credentials
    const ringApi = new RingApi({
      email,
      password,
      // This callback is invoked when 2FA is required
      async onRefreshTokenUpdated({ newRefreshToken, oldRefreshToken }) {
        console.log('\n✓ Refresh token updated');
        refreshToken = newRefreshToken;

        // Save to config
        saveRefreshToken(newRefreshToken);
      }
    });

    // Attempt to get locations - this triggers authentication
    try {
      const locations = await ringApi.getLocations();
      console.log(`\n✓ Successfully authenticated!`);
      console.log(`✓ Found ${locations.length} location(s)`);

      if (!refreshToken) {
        // If we got here without the callback, there might be an existing token
        console.log('✓ Using existing session');
      }

      console.log('\n═'.repeat(70));
      console.log('Authentication Complete');
      console.log('═'.repeat(70));
      console.log('\nNext steps:');
      console.log('1. Run the device selection script: node scripts/select-device.js');
      console.log('2. Start the server: npm start');

    } catch (error) {
      if (error.message && error.message.includes('2fa')) {
        // Need 2FA code
        console.log('\n2FA code required');
        const code = await question('Enter 2FA code from your authenticator app: ');

        // The ring-client-api handles 2FA differently - we need to use acquireRefreshToken
        const api = new RingApi({});
        refreshToken = await api.acquireRefreshToken({
          email,
          password,
          code
        });

        console.log('\n✓ 2FA successful!');
        saveRefreshToken(refreshToken);

        console.log('\n═'.repeat(70));
        console.log('Authentication Complete');
        console.log('═'.repeat(70));
        console.log('\nNext steps:');
        console.log('1. Run the device selection script: node scripts/select-device.js');
        console.log('2. Start the server: npm start');

      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n✗ Authentication failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function saveRefreshToken(token) {
  let config = {};

  // Load existing config if it exists
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      config = JSON.parse(data);
    } catch (error) {
      console.error('Warning: Error reading existing config:', error.message);
    }
  }

  // Update refresh token
  config.refreshToken = token;

  // Save config
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✓ Refresh token saved to config.json');
  } catch (error) {
    console.error('✗ Error saving config:', error.message);
    console.log('\nYour refresh token (save manually):');
    console.log(token);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nAuthentication cancelled');
  rl.close();
  process.exit(0);
});

authenticate();
