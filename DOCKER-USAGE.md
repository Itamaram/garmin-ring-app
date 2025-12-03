# Docker Usage Guide

This guide explains how to use the Ring-Garmin integration server with Docker.

## Quick Start

### 1. Build and Setup

Run the setup script:
```bash
./docker-setup.sh
```

### 2. Configure the Server

Execute the setup scripts inside the container using `docker-compose run`:

#### Step 1: Authenticate with Ring
```bash
docker-compose run --rm ring-server node scripts/auth.js
```

You'll be prompted for:
- Ring email address
- Ring password
- 2FA code from your authenticator app

#### Step 2: Select Device
```bash
docker-compose run --rm ring-server node scripts/select-device.js
```

This will list all your Ring devices and let you select which one to control from your Garmin watch.

#### Step 3: Generate Shared Secret
```bash
docker-compose run --rm ring-server node scripts/generate-secret.js
```

**IMPORTANT**: Save this secret! You'll need to configure it in your Garmin watch app.

### 3. Start the Server

```bash
docker-compose up -d
```

### 4. Verify

Check that the server is running:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "configured": true,
  "ringConnected": true,
  "timestamp": 1234567890
}
```

## Alternative: Using docker exec

If you prefer to keep a container running and use `docker exec`:

### 1. Start Setup Container
```bash
docker-compose --profile setup up -d ring-server-setup
```

### 2. Run Setup Commands
```bash
# Authenticate
docker exec -it ring-garmin-server-setup node scripts/auth.js

# Select device
docker exec -it ring-garmin-server-setup node scripts/select-device.js

# Generate secret
docker exec -it ring-garmin-server-setup node scripts/generate-secret.js
```

### 3. Stop Setup Container and Start Production
```bash
docker-compose --profile setup down
docker-compose up -d
```

## Managing the Server

### View Logs
```bash
docker-compose logs -f ring-server
```

### Stop Server
```bash
docker-compose down
```

### Restart Server
```bash
docker-compose restart ring-server
```

### Rebuild After Code Changes
```bash
docker-compose build
docker-compose up -d
```

## Configuration Persistence

All configuration is stored in `./config/config.json` which is mounted as a volume. This means:
- Configuration persists across container restarts
- You can backup/restore by copying this file
- Multiple containers can share the same configuration (not recommended for production)

## Troubleshooting

### Container won't start
Check logs:
```bash
docker-compose logs ring-server
```

Common issues:
- Missing configuration (run setup scripts)
- Port 3000 already in use (change in docker-compose.yml)

### Authentication fails
Your refresh token may have expired. Re-run authentication:
```bash
docker-compose run --rm ring-server node scripts/auth.js
```

### Can't find device
Re-run device selection:
```bash
docker-compose run --rm ring-server node scripts/select-device.js
```
