# Using Pre-built Container Images

This guide explains how to use the pre-built container images from GitHub Container Registry instead of building locally.

## Prerequisites

- Docker installed
- GitHub account (for pulling from GHCR)

## Quick Start

### 1. Pull the Latest Container

```bash
docker pull ghcr.io/OWNER/REPO:latest
```

Replace `OWNER/REPO` with your GitHub repository path (e.g., `username/garmin-ring-app`).

### 2. Create Config Directory

```bash
mkdir -p config
```

### 3. Run Setup Scripts

**Authenticate with Ring:**
```bash
docker run --rm -it \
  -v $(pwd)/config:/app/config \
  ghcr.io/OWNER/REPO:latest \
  node scripts/auth.js
```

**Select Device:**
```bash
docker run --rm -it \
  -v $(pwd)/config:/app/config \
  ghcr.io/OWNER/REPO:latest \
  node scripts/select-device.js
```

**Generate Shared Secret:**
```bash
docker run --rm -it \
  -v $(pwd)/config:/app/config \
  ghcr.io/OWNER/REPO:latest \
  node scripts/generate-secret.js
```

**Save the secret!** You'll need it for the Garmin app configuration.

### 4. Start the Server

```bash
docker run -d \
  --name ring-garmin-server \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  --restart unless-stopped \
  ghcr.io/OWNER/REPO:latest
```

### 5. Verify

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "configured": true,
  "ringConnected": true,
  "timestamp": 1234567890
}
```

## Using Docker Compose with Pre-built Image

Create a `docker-compose.prebuilt.yml`:

```yaml
version: '3.8'

services:
  ring-server:
    image: ghcr.io/OWNER/REPO:latest
    container_name: ring-garmin-server
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

**Usage:**
```bash
# Setup
docker-compose -f docker-compose.prebuilt.yml run --rm ring-server node scripts/auth.js
docker-compose -f docker-compose.prebuilt.yml run --rm ring-server node scripts/select-device.js
docker-compose -f docker-compose.prebuilt.yml run --rm ring-server node scripts/generate-secret.js

# Start
docker-compose -f docker-compose.prebuilt.yml up -d

# Logs
docker-compose -f docker-compose.prebuilt.yml logs -f

# Stop
docker-compose -f docker-compose.prebuilt.yml down
```

## Downloading Garmin App

### From GitHub Actions Artifacts

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Find the latest successful workflow run
4. Scroll to "Artifacts" section
5. Download "garmin-watch-app"
6. Extract and find the `.prg` file for your watch model

### From GitHub Releases

For tagged releases:

1. Go to repository "Releases" page
2. Download the latest release
3. Extract `ring-control-garmin-apps-vX.X.X.zip`
4. Find the `.prg` file for your watch model

### Supported Watch Models

Check the artifacts for available builds:
- `ring-control-fenix6.prg`
- `ring-control-fenix7.prg`
- `ring-control-fr945.prg`
- `ring-control-vivoactive4.prg`
- And more...

## Installing Garmin App

### Via USB

1. Download the `.prg` file for your watch model
2. Connect watch to computer via USB
3. Watch appears as USB drive
4. Copy `.prg` file to `GARMIN/APPS/` folder
5. Safely eject watch
6. Disconnect and restart watch

### Via Garmin Express

1. Download `.prg` file
2. Connect watch to computer
3. Open Garmin Express
4. Select your device
5. Go to "Apps" → "Install custom app"
6. Select the downloaded `.prg` file

## Configuring the Garmin App

### Via Garmin Connect Mobile App

1. Open Garmin Connect app
2. Menu → Devices → Your Watch
3. Apps → Ring Control → Settings
4. Configure:
   - **Server URL**: `http://YOUR_SERVER_IP:3000`
   - **Shared Secret**: The hex string from generate-secret.js

### Important Configuration Notes

**Server URL:**
- Use your server's IP address, not `localhost`
- Find IP: `ip addr show` (Linux) or `ipconfig` (Windows)
- Example: `http://192.168.1.100:3000`
- Include `http://` and port `:3000`

**Shared Secret:**
- Must match exactly between server and watch
- 64-character hex string
- No spaces or line breaks

## Updating

### Update Server Container

```bash
# Pull latest image
docker pull ghcr.io/OWNER/REPO:latest

# Restart container
docker restart ring-garmin-server
```

### Update Garmin App

1. Download new `.prg` file from latest workflow/release
2. Remove old app from watch
3. Install new `.prg` file
4. Reconfigure if needed

## Advantages of Pre-built Images

✅ **No Build Tools Required**: No need to install Node.js, TypeScript, or Garmin SDK
✅ **Faster Setup**: Pull image instead of building (minutes vs. seconds)
✅ **Consistent Builds**: Same image for all users
✅ **Automatic Updates**: Pull latest when new version is released
✅ **CI/CD Tested**: Built and tested in GitHub Actions

## Versioning

### Latest (Rolling)
```bash
docker pull ghcr.io/OWNER/REPO:latest
```
Always gets the newest main branch build.

### Specific Version
```bash
docker pull ghcr.io/OWNER/REPO:v1.0.0
```
Use for production stability.

### Commit SHA
```bash
docker pull ghcr.io/OWNER/REPO:main-abc1234
```
Pin to exact commit.

## Private Repositories

If your repository is private, authenticate with GHCR:

```bash
# Create personal access token with read:packages scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Then pull as normal.

## Troubleshooting

### Can't Pull Image

**Error:** `unauthorized: authentication required`

**Solution:**
- Repository may be private
- Authenticate: `docker login ghcr.io`
- Or make repository/package public in GitHub settings

### Image Not Found

**Error:** `manifest unknown: manifest unknown`

**Solution:**
- Check repository name is correct
- Ensure GitHub Actions workflow has run successfully
- Check if package exists: github.com/OWNER/REPO/pkgs/container/REPO

### Old Image

**Problem:** Changes not reflected after pull

**Solution:**
```bash
# Force pull latest
docker pull ghcr.io/OWNER/REPO:latest --no-cache

# Remove old container and recreate
docker rm -f ring-garmin-server
docker run -d --name ring-garmin-server ...
```

## Security Notes

- Configuration (including secrets) is stored in local `config/` volume
- Each deployment generates its own unique shared secret
- Secrets are never baked into the container image
- Container runs as unprivileged user
- No sensitive data in image layers

## Support

- Check workflow runs: github.com/OWNER/REPO/actions
- View published packages: github.com/OWNER/REPO/pkgs
- Report issues: github.com/OWNER/REPO/issues
