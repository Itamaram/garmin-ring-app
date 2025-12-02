#!/usr/bin/env node

/**
 * Interactive device selection script
 * Lists all available Ring devices and allows user to select which device
 * the Garmin watch will control
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

async function selectDevice() {
  console.log('═'.repeat(70));
  console.log('Ring Device Selection');
  console.log('═'.repeat(70));

  try {
    // Load config to get refresh token
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      config = JSON.parse(data);
    }

    if (!config.refreshToken) {
      console.error('\n✗ No refresh token found!');
      console.error('Please run authentication first: node scripts/auth.js');
      process.exit(1);
    }

    console.log('\n✓ Loading Ring devices...');

    // Initialize Ring API with refresh token
    const ringApi = new RingApi({
      refreshToken: config.refreshToken,
      // Handle token updates
      onRefreshTokenUpdated: ({ newRefreshToken }) => {
        config.refreshToken = newRefreshToken;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      }
    });

    // Get all locations and devices
    const locations = await ringApi.getLocations();
    const allDevices = [];

    console.log(`\n✓ Found ${locations.length} location(s)\n`);

    for (const location of locations) {
      console.log(`Location: ${location.name || 'Unnamed'}`);
      console.log('─'.repeat(70));

      // Get cameras/doorbells
      const cameras = location.cameras;
      for (const camera of cameras) {
        const deviceInfo = {
          id: camera.id,
          name: camera.name,
          type: camera.deviceType,
          location: location.name,
          batteryLevel: camera.batteryLevel,
          hasChime: camera.hasChime,
          device: camera
        };
        allDevices.push(deviceInfo);
      }

      // Get intercoms
      const intercoms = location.intercoms || [];
      for (const intercom of intercoms) {
        const deviceInfo = {
          id: intercom.id,
          name: intercom.name || intercom.description,
          type: 'Intercom',
          location: location.name,
          device: intercom
        };
        allDevices.push(deviceInfo);
      }

      // Get locks
      const locks = location.locks || [];
      for (const lock of locks) {
        const deviceInfo = {
          id: lock.id,
          name: lock.name,
          type: 'Lock',
          location: location.name,
          batteryLevel: lock.batteryLevel,
          device: lock
        };
        allDevices.push(deviceInfo);
      }

      console.log();
    }

    if (allDevices.length === 0) {
      console.error('✗ No devices found!');
      console.error('Make sure you have Ring devices associated with your account.');
      process.exit(1);
    }

    // Display all devices with numbers
    console.log('Available Devices:');
    console.log('═'.repeat(70));
    allDevices.forEach((device, index) => {
      console.log(`\n[${index + 1}] ${device.name}`);
      console.log(`    Type: ${device.type}`);
      console.log(`    Location: ${device.location}`);
      if (device.batteryLevel !== undefined) {
        console.log(`    Battery: ${device.batteryLevel}%`);
      }
      if (device.hasChime) {
        console.log(`    Features: Chime available`);
      }
    });

    console.log('\n' + '═'.repeat(70));

    // Get user selection
    const answer = await question('\nSelect device number (or q to quit): ');

    if (answer.toLowerCase() === 'q') {
      console.log('Selection cancelled');
      process.exit(0);
    }

    const selection = parseInt(answer, 10) - 1;

    if (isNaN(selection) || selection < 0 || selection >= allDevices.length) {
      console.error('✗ Invalid selection');
      process.exit(1);
    }

    const selectedDevice = allDevices[selection];

    // Save selection to config
    config.selectedDeviceId = selectedDevice.id.toString();
    config.selectedDeviceName = selectedDevice.name;
    config.selectedDeviceType = selectedDevice.type;

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

    console.log('\n✓ Device selected successfully!');
    console.log('─'.repeat(70));
    console.log(`Name: ${selectedDevice.name}`);
    console.log(`Type: ${selectedDevice.type}`);
    console.log(`ID: ${selectedDevice.id}`);
    console.log('─'.repeat(70));

    console.log('\n═'.repeat(70));
    console.log('Configuration Complete');
    console.log('═'.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Generate shared secret: node scripts/generate-secret.js');
    console.log('2. Start the server: npm start');
    console.log('3. Configure your Garmin watch app with the server URL and secret');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.message.includes('Unauthorized')) {
      console.error('\nYour refresh token may have expired.');
      console.error('Please run authentication again: node scripts/auth.js');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nSelection cancelled');
  rl.close();
  process.exit(0);
});

selectDevice();
