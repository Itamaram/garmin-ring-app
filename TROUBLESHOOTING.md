# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Ring-Garmin integration.

## Table of Contents

- [Server Issues](#server-issues)
- [Garmin Watch App Issues](#garmin-watch-app-issues)
- [Network Issues](#network-issues)
- [Authentication Issues](#authentication-issues)
- [Ring Device Issues](#ring-device-issues)
- [Docker Issues](#docker-issues)

---

## Server Issues

### Server Won't Start

**Symptom:** Container exits immediately or won't start

**Diagnosis:**
```bash
# Check logs
docker-compose logs ring-server

# Check if port is in use
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows
```

**Solutions:**

1. **Missing configuration:**
   ```bash
   # Check what's missing
   docker-compose run --rm ring-server node scripts/generate-secret.js
   docker-compose run --rm ring-server node scripts/auth.js
   docker-compose run --rm ring-server node scripts/select-device.js
   ```

2. **Port already in use:**
   - Change port in `docker-compose.yml`:
     ```yaml
     ports:
       - "3001:3000"  # Use different external port
     ```

3. **Invalid refresh token:**
   ```bash
   # Re-authenticate
   docker-compose run --rm ring-server node scripts/auth.js
   ```

### Health Check Fails

**Symptom:** `/health` endpoint returns errors or is unreachable

**Diagnosis:**
```bash
# Check server is running
docker ps | grep ring-garmin-server

# Check server logs
docker-compose logs -f ring-server

# Test health endpoint
curl http://localhost:3000/health
```

**Solutions:**

1. **Server not configured:**
   - Check health response for `"configured": false`
   - Run missing setup steps shown in `"missing"` array

2. **Ring not connected:**
   - Check health response for `"ringConnected": false`
   - Refresh token may be expired - re-run authentication

---

## Garmin Watch App Issues

### "Not Configured" Message

**Symptom:** Watch shows "Not Configured" when pressing SELECT

**Solutions:**

1. **Configure server URL:**
   - Open Garmin Connect app on phone
   - Go to: Device → Apps → Ring Control → Settings
   - Enter server URL: `http://YOUR_SERVER_IP:3000`
   - Make sure to use your actual server IP, not `localhost`

2. **Configure shared secret:**
   - In same settings menu
   - Enter the hex secret from `generate-secret.js`
   - Make sure to copy the entire hex string

3. **Verify settings saved:**
   - Exit and re-open settings
   - Confirm both fields are populated

### "Network Error" Message

**Symptom:** Watch shows "Network Error" after pressing SELECT

**Diagnosis:**
```bash
# Check if server is reachable from phone
curl http://YOUR_SERVER_IP:3000/health

# Check watch WiFi connection
# Watch must be connected to WiFi or have LTE
```

**Solutions:**

1. **Watch not connected to WiFi:**
   - On watch: Settings → Phone → WiFi
   - Connect to same network as server

2. **Incorrect server URL:**
   - Verify IP address is correct
   - Use IP address, not hostname
   - Include port: `:3000`
   - Use `http://` not `https://` (unless SSL configured)

3. **Firewall blocking:**
   ```bash
   # Allow port 3000 (Linux)
   sudo ufw allow 3000

   # Check Windows Firewall
   # Add inbound rule for port 3000
   ```

4. **Server on different network:**
   - Server must be accessible from watch's network
   - Consider VPN or port forwarding
   - For testing, use same WiFi for watch and server

### "Auth Failed" Message

**Symptom:** Watch shows "Auth Failed" or returns 401 error

**Solutions:**

1. **Shared secret mismatch:**
   - Regenerate secret: `docker-compose run --rm ring-server node scripts/generate-secret.js`
   - Update watch app settings with new secret
   - Ensure exact copy of hex string (no spaces or line breaks)

2. **Clock skew:**
   - Garmin watch syncs time automatically
   - Force sync: Settings → System → Time → Sync Time
   - Check server time: `docker exec ring-garmin-server date`

3. **Old timestamp:**
   - Timestamps valid for 5 minutes only
   - If watch clock is wrong, requests will fail
   - Sync watch with GPS or phone

### App Crashes or Won't Load

**Symptom:** App exits immediately or shows error

**Solutions:**

1. **Reinstall app:**
   - Delete app from watch
   - Rebuild: `monkeyc -f monkey.jungle -d YOUR_DEVICE -o app.prg`
   - Reinstall to watch

2. **Check device compatibility:**
   - Verify your watch model in `manifest.xml`
   - Some older watches may not support required API level

3. **Memory issues:**
   - Close other apps on watch
   - Restart watch
   - Simplify app if customized

---

## Network Issues

### Can't Reach Server from Watch

**Diagnosis:**
```bash
# From computer on same WiFi as watch:
# 1. Find server IP
ip addr show  # Linux
ipconfig      # Windows

# 2. Test server
curl http://SERVER_IP:3000/health

# 3. Test from phone (if available)
# Open browser, visit: http://SERVER_IP:3000/health
```

**Solutions:**

1. **Use correct IP address:**
   - Not `localhost` or `127.0.0.1`
   - Use actual network IP (e.g., `192.168.1.100`)
   - Find IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)

2. **Same network:**
   - Watch and server must be on same WiFi
   - Or use VPN/port forwarding

3. **Docker networking:**
   - Ensure port is properly mapped in `docker-compose.yml`
   - Use host network if needed:
     ```yaml
     network_mode: "host"
     ```

### Intermittent Connection Issues

**Solutions:**

1. **WiFi stability:**
   - Watch WiFi can be unstable
   - Move closer to router
   - Reduce interference

2. **Server restarts:**
   - Check logs for crashes
   - Increase memory if needed
   - Use `restart: unless-stopped` in compose file

---

## Authentication Issues

### 2FA Code Not Accepted

**Symptom:** `auth.js` rejects 2FA code

**Solutions:**

1. **Code expired:**
   - 2FA codes expire quickly (30 seconds)
   - Generate new code and enter immediately

2. **Wrong authenticator app:**
   - Use the same app you set up with Ring
   - Check it's for the correct account

3. **Time sync on phone:**
   - Authenticator apps require accurate time
   - Enable automatic time sync on phone

### "Unauthorized" Error from Ring

**Symptom:** Server can't connect to Ring API

**Solutions:**

1. **Refresh token expired:**
   ```bash
   # Re-authenticate
   docker-compose run --rm ring-server node scripts/auth.js
   ```

2. **Account locked:**
   - Too many failed login attempts
   - Wait 1 hour or contact Ring support

3. **Ring service issues:**
   - Check Ring status: https://status.ring.com
   - Wait for service restoration

### Token Won't Update

**Symptom:** New refresh tokens not being saved

**Solutions:**

1. **Config file permissions:**
   ```bash
   # Check permissions
   ls -l config/config.json

   # Fix if needed
   chmod 644 config/config.json
   ```

2. **Volume mount issues:**
   - Check `docker-compose.yml` volume mounts
   - Ensure `./config` directory exists
   - Try recreating container

---

## Ring Device Issues

### Device Not Found

**Symptom:** `select-device.js` shows no devices

**Solutions:**

1. **Verify Ring account:**
   - Log into Ring app/website
   - Confirm devices are visible there

2. **Shared devices:**
   - You must own the devices
   - Shared devices may not appear in API

3. **Re-authenticate:**
   ```bash
   docker-compose run --rm ring-server node scripts/auth.js
   docker-compose run --rm ring-server node scripts/select-device.js
   ```

### Unlock Doesn't Work

**Symptom:** Server returns success but door doesn't unlock

**Solutions:**

1. **Wrong device selected:**
   - Run `select-device.js` again
   - Choose correct device

2. **Device offline:**
   - Check device in Ring app
   - Ensure it's online and has power

3. **Device type mismatch:**
   - Not all devices support all actions
   - Intercoms support unlock
   - Cameras don't support unlock (only lights)

4. **Ring app permissions:**
   - Some accounts have restricted access
   - Verify you can unlock via Ring app

### Action Takes Too Long

**Symptom:** Server timeout or slow response

**Solutions:**

1. **Network latency:**
   - Ring API calls can be slow
   - Normal for first request after idle

2. **Device response:**
   - Some devices are slower to respond
   - Wait up to 10 seconds

---

## Docker Issues

### Build Fails

**Symptom:** `docker-compose build` errors

**Solutions:**

1. **Disk space:**
   ```bash
   df -h  # Check disk space
   docker system prune  # Clean up
   ```

2. **Network issues:**
   - Retry build
   - Check internet connection
   - npm registry may be slow

3. **Dependencies:**
   ```bash
   # Force rebuild without cache
   docker-compose build --no-cache
   ```

### Container Keeps Restarting

**Symptom:** Container in restart loop

**Diagnosis:**
```bash
# Check logs
docker-compose logs -f ring-server

# Check restart count
docker ps -a
```

**Solutions:**

1. **Missing config:**
   - Complete all setup steps
   - Check logs for specific error

2. **Invalid config:**
   - Delete `config/config.json`
   - Re-run setup scripts

3. **Port conflict:**
   - Change port in `docker-compose.yml`

### Volume Mount Issues

**Symptom:** Config not persisting

**Solutions:**

1. **Check mount:**
   ```bash
   docker inspect ring-garmin-server | grep Mounts -A 10
   ```

2. **Recreate container:**
   ```bash
   docker-compose down
   docker-compose --profile manual up -d ring-server
   ```

3. **Permissions:**
   ```bash
   # Ensure config directory exists
   mkdir -p config
   chmod 755 config
   ```

---

## Debugging Tips

### Enable Debug Logging

**Server:**
```bash
# Set environment variable
docker-compose run --rm -e DEBUG=* ring-server npm start
```

**Watch App:**
- Check device logs via Garmin Express
- Add `System.println()` statements
- Build in debug mode

### Check Request/Response

**Test with curl:**
```bash
# Generate signature
curl -X POST http://localhost:3000/test/signature \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock"}'

# Copy the response and make authenticated request
curl -X POST http://localhost:3000/action \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock","timestamp":1234567890,"signature":"abc..."}'
```

### Monitor Server Logs

```bash
# Follow logs in real-time
docker-compose logs -f ring-server

# Last 100 lines
docker-compose logs --tail=100 ring-server
```

---

## Getting Help

If you're still having issues:

1. **Check logs:**
   - Server: `docker-compose logs ring-server`
   - Watch: Via Garmin Express

2. **Verify configuration:**
   - Server: `curl http://localhost:3000/health`
   - Watch: Check app settings

3. **Test components separately:**
   - Test server with curl
   - Test watch on WiFi

4. **Open an issue:**
   - Include error messages
   - Include relevant logs
   - Describe steps to reproduce

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "ECONNREFUSED" | Can't connect to server | Check server is running and IP is correct |
| "ETIMEDOUT" | Connection timeout | Check network, firewall |
| "Invalid signature" | Auth failed | Verify shared secret matches |
| "Request timestamp is too old" | Clock skew | Sync watch time |
| "No refresh token found" | Server not configured | Run auth.js |
| "Device does not support unlock" | Wrong device type | Select correct device |
| "Network Error" (watch) | Can't reach server | Check WiFi, server URL |
| "Not Configured" (watch) | Settings missing | Configure app settings |
