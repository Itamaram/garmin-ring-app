# Complete Setup Guide

This guide walks you through the complete setup process from scratch.

## Prerequisites

Before you begin, ensure you have:

- ✅ Docker and Docker Compose installed
- ✅ Ring account with devices set up
- ✅ Two-factor authentication enabled on Ring account
- ✅ Garmin smartwatch (check compatibility in main README)
- ✅ Computer with network access to Ring cloud services

## Part 1: Server Setup (30 minutes)

### Step 1: Clone and Prepare

```bash
# Clone the repository
git clone <repository-url>
cd garmin-ring-app

# Create config directory
mkdir -p config

# Make setup script executable (if needed)
chmod +x docker-setup.sh
```

### Step 2: Build Docker Image

```bash
# Run the setup script
./docker-setup.sh

# OR manually build:
docker-compose build
```

This will:
- Pull Node.js base image
- Install dependencies
- Build TypeScript code
- Create production image

**Expected time:** 5-10 minutes (depending on internet speed)

### Step 3: Authenticate with Ring

```bash
docker-compose run --rm ring-server node scripts/auth.js
```

You'll be prompted for:
1. **Ring email**: Your Ring account email
2. **Ring password**: Your Ring account password (input is hidden)
3. **2FA code**: 6-digit code from your authenticator app

**Tips:**
- Have your phone ready with authenticator app
- 2FA codes expire in 30 seconds - enter quickly
- If it fails, just run the command again

**What happens:**
- Authenticates with Ring API
- Obtains refresh token
- Saves token to `config/config.json`

**Expected time:** 2 minutes

### Step 4: Select Your Device

```bash
docker-compose run --rm ring-server node scripts/select-device.js
```

You'll see:
1. List of all your Ring locations
2. All devices at each location
3. Device details (type, battery level, etc.)

**Select the device you want to control from your watch.**

**What happens:**
- Connects to Ring API
- Lists all available devices
- Saves your selection to `config/config.json`

**Expected time:** 2 minutes

### Step 5: Generate Shared Secret

```bash
docker-compose run --rm ring-server node scripts/generate-secret.js
```

**CRITICAL:** Save the generated secret! You'll need it for the watch app.

Example output:
```
✓ Shared secret generated successfully!

IMPORTANT: Save this secret for your Garmin watch app configuration:
──────────────────────────────────────────────────────────────────────
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
──────────────────────────────────────────────────────────────────────

This secret is also saved in config.json
```

**Copy this hex string** - you'll need it later!

**What happens:**
- Generates cryptographically secure random secret (256-bit)
- Saves to `config/config.json`
- Displays for manual configuration of watch app

**Expected time:** 1 minute

### Step 6: Start the Server

```bash
docker-compose --profile manual up -d ring-server
```

**What happens:**
- Starts server in background
- Loads configuration from `config.json`
- Connects to Ring API
- Exposes HTTP endpoints on port 3000

**Expected time:** 30 seconds

### Step 7: Verify Server is Running

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "configured": true,
  "ringConnected": true,
  "timestamp": 1234567890
}
```

✅ If you see this, the server is ready!

**Troubleshooting:**
- If `configured: false`, re-run missing setup steps
- If `ringConnected: false`, re-run authentication
- If connection refused, check if container is running: `docker ps`

---

## Part 2: Garmin Watch App Setup (45 minutes)

### Step 8: Install Garmin Connect IQ SDK

**Download SDK:**
- Visit: https://developer.garmin.com/connect-iq/sdk/
- Download for your OS (Windows, Mac, or Linux)
- Install following Garmin's instructions

**Or use VS Code:**
- Install Visual Studio Code
- Install "Monkey C" extension by Garmin
- Extension will help manage SDK

**Expected time:** 10 minutes

### Step 9: Build the Watch App

**Using VS Code:**
1. Open `garmin/` folder in VS Code
2. Select your watch model from device dropdown
3. Press `Ctrl+Shift+B` to build
4. Result: `ring-control.prg` file

**Using Command Line:**
```bash
cd garmin

# Build for your specific watch (replace with your model)
monkeyc -f monkey.jungle -d fenix6 -o ring-control.prg -y /path/to/developer_key

# Test in simulator
monkeydo ring-control.prg fenix6
```

**Watch models:** Check `manifest.xml` for supported models

**Expected time:** 5 minutes

### Step 10: Install App on Watch

**Method 1: Via USB**
1. Connect watch to computer via USB
2. Watch appears as USB drive
3. Navigate to `GARMIN/APPS` folder
4. Copy `ring-control.prg` to this folder
5. Safely eject watch
6. Disconnect USB
7. Restart watch (optional but recommended)

**Method 2: Via Garmin Express (easier)**
1. Connect watch to computer
2. Open Garmin Express
3. Select your device
4. Go to "Apps" section
5. Click "Install" for custom apps
6. Select `ring-control.prg` file

**Expected time:** 5 minutes

### Step 11: Find Your Server IP Address

Your watch needs to know where to find the server.

**On Linux:**
```bash
ip addr show
# Look for IP like 192.168.1.100
```

**On Mac:**
```bash
ifconfig
# Look for inet address
```

**On Windows:**
```cmd
ipconfig
# Look for IPv4 Address
```

**Important:**
- Use the IP on your WiFi network
- NOT `localhost` or `127.0.0.1`
- Example: `192.168.1.100`

### Step 12: Configure Watch App

**Option A: Via Garmin Connect Mobile App (Recommended)**

1. Open Garmin Connect app on phone
2. Tap **Menu** (≡) → **Devices**
3. Select your watch
4. Tap **Apps**
5. Find "Ring Control" in the list
6. Tap **Settings** gear icon
7. Configure:
   - **Server URL**: `http://YOUR_IP_ADDRESS:3000`
     - Example: `http://192.168.1.100:3000`
     - Use IP from Step 11
     - Include `http://` and port `:3000`
   - **Shared Secret**: Paste the hex secret from Step 5
     - Should be 64 characters long
     - No spaces or line breaks
8. Tap **Save**

**Option B: Via Watch Settings**

1. On watch, long press on watch face
2. Select **Settings**
3. Navigate to **Apps**
4. Find and select **Ring Control**
5. Select **Settings**
6. Enter Server URL (difficult on watch - use phone method if possible)
7. Enter Shared Secret

**Option C: Via Garmin Express (Desktop)**

1. Connect watch to computer
2. Open Garmin Express
3. Select your device
4. Click **Apps**
5. Click settings icon (⚙) next to "Ring Control"
6. Enter Server URL and Shared Secret
7. Click Save
8. Sync watch

**Expected time:** 5 minutes

---

## Part 3: Testing (10 minutes)

### Step 13: Test on Watch

1. **On your watch:**
   - Press UP/DOWN to apps
   - Find "Ring Control"
   - Press SELECT to open

2. **You should see:**
   - App name: "Ring Control"
   - Status: "Unlock Door"
   - Instruction: "Press SELECT"

3. **Press SELECT button**

4. **Expected behavior:**
   - Status changes to "Unlocking..."
   - After 1-2 seconds: "Door Unlocked!"
   - Your Ring device should unlock!

### Step 14: Verify Server Logs

```bash
# Watch server logs
docker-compose logs -f ring-server
```

You should see:
```
Executing action: unlock on device: Front Door Intercom
✓ Door unlocked successfully
```

### Step 15: Test from Different Locations

The magic of this integration is using it while away from home!

**Test scenarios:**
1. ✅ Same WiFi as server (should work)
2. ✅ Different WiFi (requires server accessibility)
3. ✅ LTE connection (requires public server or VPN)

---

## Part 4: Production Deployment (Optional)

For daily use, consider these improvements:

### Make Server Accessible Remotely

**Option 1: Port Forwarding (Simple)**
- Configure router to forward port 3000 to server
- Use dynamic DNS service (like DuckDNS)
- Update watch app URL to public address

**Option 2: VPN (Secure)**
- Set up VPN server at home (WireGuard, OpenVPN)
- Connect watch to VPN
- Keep server on local network only

**Option 3: Reverse Proxy with SSL (Recommended)**
- Use Cloudflare Tunnel or ngrok
- Add SSL certificate (Let's Encrypt)
- Update watch app to use HTTPS URL

### Add SSL/TLS

```bash
# Example with Let's Encrypt
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update docker-compose.yml to mount certificates
# Configure nginx or update Node.js server for HTTPS
```

### Auto-restart Server

Already configured in `docker-compose.yml`:
```yaml
restart: unless-stopped
```

Server will automatically restart:
- After system reboot
- If container crashes
- After Docker updates

### Monitor Server

```bash
# Check status
docker ps | grep ring-garmin

# View logs
docker-compose logs -f ring-server

# Check resource usage
docker stats ring-garmin-server
```

---

## Maintenance

### Update Refresh Token (When Expired)

If watch shows auth errors:
```bash
docker-compose run --rm ring-server node scripts/auth.js
docker-compose restart ring-server
```

### Change Selected Device

```bash
docker-compose run --rm ring-server node scripts/select-device.js
docker-compose restart ring-server
```

### Rotate Shared Secret (Security Best Practice)

```bash
# Generate new secret
docker-compose run --rm ring-server node scripts/generate-secret.js

# Update watch app with new secret
# Restart server
docker-compose restart ring-server
```

### Update Server Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose --profile manual up -d ring-server
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed troubleshooting steps.

**Quick checks:**
1. ✅ Server running: `docker ps`
2. ✅ Server healthy: `curl http://localhost:3000/health`
3. ✅ Watch on WiFi: Settings → Phone → WiFi
4. ✅ Watch configured: Garmin Connect → Apps → Ring Control → Settings
5. ✅ Secret matches: Compare watch secret with `cat config/config.json`

---

## Support

- **Documentation**: [README.md](README.md), [API.md](API.md)
- **Issues**: Open GitHub issue with logs and error messages
- **Security**: For security issues, contact privately

---

## Next Steps

🎉 **Congratulations!** Your Ring-Garmin integration is ready!

**Daily use:**
- Open Ring Control app on watch
- Press SELECT
- Door unlocks!

**Customize:**
- Add more actions (lights, etc.)
- Create multiple watch apps for different devices
- Set up automations

**Share:**
- Show friends and family
- Contribute improvements
- Report bugs

Enjoy your smart home integration!
