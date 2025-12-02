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
docker-compose --profile manual up -d ring-server

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

### Server Development

```bash
cd server
npm install
npm run dev
```

### Watch App Development

```bash
cd garmin
# Build for specific device
monkeyc -f monkey.jungle -d fenix6 -o ring-control.prg
# Run in simulator
monkeydo ring-control.prg fenix6
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
