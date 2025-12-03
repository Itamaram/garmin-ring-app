# Ring-Garmin Integration

Control your Amazon Ring intercom directly from your Garmin smartwatch with a single button press.

## Overview

This project enables you to unlock your Ring intercom using your Garmin smartwatch. It consists of two components:

1. **Server**: A containerized Node.js/TypeScript HTTP server that maintains an active Ring session and exposes authenticated endpoints
2. **Garmin App**: A Connect IQ watch app that sends signed requests to the server

## Features

### Server
- 🔐 Secure Ring API integration with refresh token management
- 🔑 HMAC-SHA256 signed request authentication
- 🐳 Docker containerized deployment
- 📝 Interactive setup scripts (auth, device selection, secret generation)
- 🔄 Automatic token refresh and persistence
- ⚡ Health check and status endpoints

### Garmin Watch App
- ⌚ One-touch door unlock
- 🔒 Cryptographically signed requests
- 📱 Real-time status feedback
- ⚙️ Configurable via Garmin Connect
- 🎯 Support for 20+ Garmin watch models

## Quick Start

> 💡 **New!** You can now use pre-built container images from GitHub Container Registry. See [USING-PREBUILT.md](USING-PREBUILT.md) for details.

### Prerequisites

- Docker and Docker Compose
- Ring account with 2FA enabled
- Garmin smartwatch (see supported devices)
- Garmin Connect IQ SDK (optional - only needed if building from source)

### 1. Server Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd garmin-ring-app

# Run setup script
./docker-setup.sh

# Configure the server
docker-compose run --rm ring-server node scripts/auth.js
docker-compose run --rm ring-server node scripts/select-device.js
docker-compose run --rm ring-server node scripts/generate-secret.js

# Start the server
docker-compose up -d

# Verify it's running
curl http://localhost:3000/health
```

### 2. Garmin Watch App Setup

See [garmin/README.md](garmin/README.md) for detailed instructions on:
- Building the Connect IQ app
- Installing on your watch
- Configuring server URL and shared secret

### 3. Usage

1. Open "Ring Control" app on your Garmin watch
2. Press SELECT button (middle right button)
3. Wait for "Door Unlocked!" confirmation

## Architecture

```
┌─────────────────┐         HTTPS/HTTP        ┌──────────────────┐
│                 │ ◄─────signed request───── │                  │
│  Ring Server    │                            │  Garmin Watch    │
│  (Docker)       │ ─────JSON response──────► │  (Connect IQ)    │
│                 │                            │                  │
└────────┬────────┘                            └──────────────────┘
         │
         │ Ring API
         │
         ▼
┌─────────────────┐
│                 │
│  Ring Cloud     │
│  (Intercom)     │
│                 │
└─────────────────┘
```

### Request Flow

1. Watch app constructs request: `{action, timestamp, signature}`
2. Signature = HMAC-SHA256(action + timestamp, sharedSecret)
3. Server validates signature and timestamp (replay protection)
4. Server executes Ring API action
5. Server returns success/failure response
6. Watch displays status

## Project Structure

```
garmin-ring-app/
├── server/                    # Node.js server
│   ├── src/
│   │   ├── index.ts          # Main HTTP server
│   │   ├── config.ts         # Configuration management
│   │   ├── ring-client.ts    # Ring API wrapper
│   │   └── auth-middleware.ts # HMAC verification
│   ├── scripts/
│   │   ├── auth.js           # Ring authentication
│   │   ├── select-device.js  # Device selection
│   │   └── generate-secret.js # Secret generation
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── garmin/                    # Garmin Connect IQ app
│   ├── source/
│   │   ├── RingControlApp.mc
│   │   ├── RingControlView.mc
│   │   ├── RingControlDelegate.mc
│   │   └── HmacSha256.mc
│   ├── resources/
│   │   ├── strings.xml
│   │   ├── layouts.xml
│   │   └── settings.xml
│   ├── manifest.xml
│   └── monkey.jungle
├── docker-compose.yml
├── docker-setup.sh
├── README.md                  # This file
├── API.md                     # API documentation
└── TROUBLESHOOTING.md         # Troubleshooting guide
```

## Configuration

### Server Configuration

Configuration is stored in `config/config.json`:

```json
{
  "refreshToken": "your_ring_refresh_token",
  "sharedSecret": "your_shared_secret_hex",
  "selectedDeviceId": "device_id",
  "selectedDeviceName": "Front Door",
  "port": 3000
}
```

This file is automatically created and managed by the setup scripts.

### Watch App Configuration

Configured via Garmin Connect:
- **Server URL**: `http://your-server-ip:3000` (or HTTPS with SSL)
- **Shared Secret**: From `generate-secret.js` output

## Security Considerations

### Current Implementation
- ✅ HMAC-SHA256 signed requests
- ✅ Timestamp-based replay attack prevention (5-minute window)
- ✅ Constant-time signature comparison
- ✅ Secure random secret generation (256-bit)

### Recommended for Production
- 🔒 Use HTTPS with valid SSL certificate
- 🔒 Deploy server behind VPN or firewall
- 🔒 Use strong network security
- 🔒 Regularly rotate shared secret
- 🔒 Monitor server logs for suspicious activity

⚠️ **Warning**: The default HTTP setup is suitable for local network use only. Do not expose the server directly to the internet without SSL/TLS.

## Supported Ring Devices

- Ring Video Doorbells (all models)
- Ring Intercoms
- Ring Smart Locks
- Ring Cameras with lights (for light control)

## Supported Garmin Devices

See [garmin/manifest.xml](garmin/manifest.xml) for the complete list, including:
- Fenix 5/6/7 series
- Forerunner 245/945 series
- Vivoactive 3/4 series

## API Documentation

See [API.md](API.md) for detailed endpoint documentation.

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

## Development

This section explains how to run the project locally for development without Docker.

### Prerequisites for Development

**Server:**
- Node.js 18+ and npm
- Git

**Garmin App:**
- [Garmin Connect IQ SDK](https://developer.garmin.com/connect-iq/sdk/)
- Java Runtime Environment (required by Connect IQ SDK)
- Visual Studio Code with Monkey C extension (recommended)

### Server Development Setup

#### 1. Install Dependencies

```bash
cd server
npm install
```

#### 2. Configure the Server

Create configuration using the setup scripts:

```bash
# Authenticate with Ring
node scripts/auth.js

# Select your device
node scripts/select-device.js

# Generate shared secret
node scripts/generate-secret.js
```

This creates `server/config.json` with your configuration.

#### 3. Run Development Server

**With hot reload (recommended):**
```bash
npm run dev
```

**Build and run:**
```bash
npm run build
npm start
```

**Direct execution (fastest for testing):**
```bash
npx ts-node src/index.ts
```

#### 4. Test the Server

```bash
# Check health
curl http://localhost:3000/health

# Generate test signature (dev mode only)
curl -X POST http://localhost:3000/test/signature \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock"}'

# Test unlock with signature
curl -X POST http://localhost:3000/action \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock","timestamp":1234567890,"signature":"YOUR_SIGNATURE"}'
```

#### 5. Development Workflow

**Edit code → Auto-reload → Test:**
- Server automatically restarts on file changes with `npm run dev`
- Check logs in terminal for errors
- Test endpoints with curl or Postman

**Configuration changes:**
```bash
# Re-run setup scripts if needed
node scripts/auth.js          # Update Ring credentials
node scripts/select-device.js # Change device
node scripts/generate-secret.js # Generate new secret
```

### Watch App Development Setup

#### 1. Install Connect IQ SDK

**Option A: Using SDK Manager (Recommended)**
1. Download from https://developer.garmin.com/connect-iq/sdk/
2. Run the installer
3. SDK Manager will download required components

**Option B: Manual Installation**
```bash
# Linux/Mac
wget https://developer.garmin.com/downloads/connect-iq/sdks/connectiq-sdk-lin-4.2.4-2024-01-24-6c3fd39.zip
unzip connectiq-sdk-lin-*.zip -d ~/connectiq-sdk
export PATH=~/connectiq-sdk/bin:$PATH
```

#### 2. Set Up VS Code (Recommended)

1. Install "Monkey C" extension by Garmin
2. Open `garmin/` folder in VS Code
3. Select device: `Forerunner 955` from status bar
4. Extension handles SDK paths automatically

#### 3. Build the App

**Using VS Code:**
- Press `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (Mac)
- Output: `bin/ring-control.prg`

**Using Command Line:**
```bash
cd garmin

# Build for Forerunner 955
monkeyc \
  -f monkey.jungle \
  -d fr955 \
  -o ring-control-fr955.prg \
  -w

# Check for warnings/errors
echo $?  # Should be 0 for success
```

#### 4. Test in Simulator

**Using VS Code:**
- Press `F5` to build and launch simulator
- App opens in Connect IQ Simulator
- Use mouse to interact

**Using Command Line:**
```bash
# Start simulator with app
monkeydo ring-control-fr955.prg fr955

# Or start simulator separately
connectiq
# Then: File → Open → select .prg file
```

#### 5. Test on Real Device

**Via USB:**
```bash
# Device must be in USB Mass Storage mode
cp ring-control-fr955.prg /path/to/GARMIN/APPS/
```

**Via WiFi (if supported):**
- VS Code can deploy directly to watch via WiFi
- Enable Developer Mode on watch
- Connect via IP in VS Code

#### 6. Development Workflow

**Make changes → Build → Test:**

1. **Edit code** in `garmin/source/*.mc`
2. **Build** with `Ctrl+Shift+B`
3. **Test** in simulator with `F5`
4. **Deploy** to watch for real testing
5. **Check logs** in VS Code Output panel

**Debugging:**
```monkey-c
// Add debug logging
System.println("Debug: Action = " + action);
System.println("Debug: Signature = " + signature);
```

View logs in VS Code Output panel or simulator console.

### Full Development Testing

Test the complete integration:

#### 1. Start Server Locally
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
```

#### 2. Configure Watch App for Local Server

Edit `garmin/resources/settings.xml` for development:
```xml
<property id="ServerUrl" type="string">http://YOUR_LOCAL_IP:3000</property>
```

Or configure via Garmin Connect app after installing.

#### 3. Test End-to-End

1. Install app on watch (or use simulator)
2. Configure with your local IP and shared secret
3. Press SELECT button
4. Watch server logs for the request
5. Verify unlock action works

### Common Development Tasks

**Update dependencies:**
```bash
cd server
npm update
```

**Rebuild TypeScript:**
```bash
cd server
npm run build
```

**Clean build artifacts:**
```bash
cd server
rm -rf dist/
npm run build
```

**Test signature generation:**
```bash
cd server
node -e "
const crypto = require('crypto');
const secret = 'YOUR_SECRET_HEX';
const action = 'unlock';
const timestamp = Math.floor(Date.now() / 1000);
const message = action + timestamp;
const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
console.log(JSON.stringify({action, timestamp, signature}, null, 2));
"
```

**Monitor Ring API calls:**
```bash
# Add debug logging to server/src/ring-client.ts
console.log('Ring API call:', deviceAction);
```

### Development Tips

**Server:**
- Use `NODE_ENV=development` for more verbose logging
- Test signature endpoint is only available in dev mode
- Configuration auto-saves on changes
- Watch for TypeScript compilation errors

**Garmin App:**
- Simulator may not perfectly match real device behavior
- Test network calls on real device
- Keep .prg files small (watch memory is limited)
- Use `System.println()` liberally for debugging

**Integration:**
- Ensure server and watch are on same WiFi for local testing
- Use your computer's local IP, not `localhost`
- Check firewall isn't blocking port 3000
- Shared secret must match exactly between server and watch

### Debugging Issues

**Server won't start:**
```bash
# Check if port is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Check config is valid
cat server/config.json | jq
```

**Garmin build fails:**
```bash
# Verify SDK installation
which monkeyc
monkeyc --version

# Check for syntax errors
monkeyc -f monkey.jungle -d fr955 -o test.prg -w
```

**Network issues:**
```bash
# Find your local IP
ip addr show  # Linux
ipconfig      # Windows
ifconfig      # Mac

# Test server is accessible
curl http://YOUR_IP:3000/health
```

### Project Structure for Developers

```
server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── config.ts          # Configuration management
│   ├── ring-client.ts     # Ring API wrapper
│   └── auth-middleware.ts # HMAC authentication
├── scripts/               # Setup scripts
├── dist/                  # Compiled JavaScript (gitignored)
└── package.json

garmin/
├── source/
│   ├── RingControlApp.mc       # App entry point
│   ├── RingControlView.mc      # UI rendering
│   ├── RingControlDelegate.mc  # Logic & networking
│   └── HmacSha256.mc          # Crypto utilities
├── resources/
│   ├── strings.xml        # Localized text
│   ├── layouts.xml        # UI layouts
│   └── settings.xml       # App configuration
└── manifest.xml           # App metadata
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [ring-client-api](https://github.com/dgreif/ring) by dgreif - Unofficial Ring API client
- Garmin Connect IQ SDK

## Disclaimer

This is an unofficial project and is not affiliated with, endorsed by, or connected to Ring LLC or Amazon.com, Inc., or Garmin Ltd. Use at your own risk.

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [API.md](API.md)
- Open an issue on GitHub
