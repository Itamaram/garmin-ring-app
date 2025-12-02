# Ring-Garmin Server API Documentation

This document describes the HTTP API endpoints provided by the Ring-Garmin integration server.

## Base URL

```
http://localhost:3000
```

Replace `localhost` with your server's IP address or hostname.

## Authentication

All authenticated endpoints require HMAC-SHA256 signed requests. The signature is computed as:

```
signature = HMAC-SHA256(action + timestamp, sharedSecret)
```

Where:
- `action`: The action being performed (e.g., "unlock")
- `timestamp`: Unix timestamp in seconds
- `sharedSecret`: Hex-encoded shared secret from configuration

### Signature Algorithm

1. Concatenate `action` and `timestamp` as strings
2. Compute HMAC-SHA256 hash using `sharedSecret` as the key
3. Encode result as hex string
4. Include in request payload

### Timestamp Validation

- Timestamps must be within 5 minutes of server time (300 seconds)
- This prevents replay attacks
- Ensure watch and server clocks are synchronized

### Example Signature Generation

**JavaScript:**
```javascript
const crypto = require('crypto');

function generateSignature(action, timestamp, sharedSecret) {
  const message = action + timestamp;
  return crypto
    .createHmac('sha256', sharedSecret)
    .update(message)
    .digest('hex');
}

// Example
const action = 'unlock';
const timestamp = Math.floor(Date.now() / 1000);
const signature = generateSignature(action, timestamp, 'your_secret_hex');
```

**Monkey C (Garmin):**
```monkeyc
var message = action + timestamp.toString();
var signature = HmacSha256.compute(message, sharedSecret);
```

## Endpoints

### GET /health

Health check endpoint - no authentication required.

**Response:**
```json
{
  "status": "ok",
  "configured": true,
  "ringConnected": true,
  "timestamp": 1234567890
}
```

**Response Fields:**
- `status`: Always "ok" if server is running
- `configured`: `true` if all configuration is complete
- `missing`: Array of missing config items (only present if `configured` is `false`)
- `ringConnected`: `true` if Ring API connection is active
- `timestamp`: Current server timestamp (Unix seconds)

**Status Codes:**
- `200 OK`: Server is healthy

---

### POST /status

Get status of the configured Ring device.

**Authentication:** Required

**Request:**
```json
{
  "action": "status",
  "timestamp": 1234567890,
  "signature": "abcdef123456..."
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "name": "Front Door",
    "id": 12345678,
    "available": true,
    "batteryLevel": 85
  }
}
```

**Response Fields:**
- `success`: `true` if request succeeded
- `device.name`: Device name
- `device.id`: Device ID
- `device.available`: Device online status
- `device.batteryLevel`: Battery percentage (if applicable)

**Status Codes:**
- `200 OK`: Request successful
- `401 Unauthorized`: Invalid signature or expired timestamp
- `500 Internal Server Error`: Server error

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### POST /action

Execute an action on the configured Ring device.

**Authentication:** Required

**Request:**
```json
{
  "action": "unlock",
  "timestamp": 1234567890,
  "signature": "abcdef123456..."
}
```

**Request Fields:**
- `action`: Action to perform (see supported actions below)
- `timestamp`: Unix timestamp in seconds
- `signature`: HMAC-SHA256 signature (hex)

**Supported Actions:**
- `unlock`: Unlock the door/intercom
- `lock`: Lock the door (for smart locks)
- `light_on`: Turn on device light (for cameras)
- `light_off`: Turn off device light (for cameras)

**Success Response:**
```json
{
  "success": true,
  "message": "Door unlocked successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Device does not support unlock"
}
```

**Status Codes:**
- `200 OK`: Request processed (check `success` field)
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid signature or expired timestamp
- `500 Internal Server Error`: Server error

---

### POST /test/signature (Development Only)

Generate a test signature for debugging. Only available when `NODE_ENV !== 'production'`.

**Authentication:** Not required

**Request:**
```json
{
  "action": "unlock"
}
```

**Response:**
```json
{
  "action": "unlock",
  "timestamp": 1234567890,
  "signature": "abcdef123456...",
  "message": "Use this in your Garmin watch request"
}
```

**Status Codes:**
- `200 OK`: Signature generated
- `400 Bad Request`: Missing action parameter

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request format or missing parameters |
| 401 | Unauthorized | Invalid signature or timestamp |
| 404 | Not Found | Endpoint does not exist |
| 500 | Internal Server Error | Server-side error |

### Application Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Missing required fields: action, timestamp, signature" | Request missing fields | Include all required fields |
| "Request timestamp is too old or too far in the future" | Timestamp outside 5-minute window | Check watch clock synchronization |
| "Invalid signature" | Signature verification failed | Verify shared secret matches |
| "Server not configured. Missing shared secret." | Server setup incomplete | Run setup scripts |
| "No device selected. Please run select-device script." | Device not configured | Run device selection script |
| "Selected device not found" | Device no longer available | Re-run device selection |
| "Device does not support unlock" | Action not supported by device | Check device capabilities |

---

## Testing with curl

### Health Check
```bash
curl http://localhost:3000/health
```

### Generate Test Signature (Dev Mode)
```bash
curl -X POST http://localhost:3000/test/signature \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock"}'
```

### Execute Action (with signature)
```bash
# First, generate signature
RESPONSE=$(curl -s -X POST http://localhost:3000/test/signature \
  -H "Content-Type: application/json" \
  -d '{"action":"unlock"}')

# Extract values
ACTION=$(echo $RESPONSE | jq -r '.action')
TIMESTAMP=$(echo $RESPONSE | jq -r '.timestamp')
SIGNATURE=$(echo $RESPONSE | jq -r '.signature')

# Make authenticated request
curl -X POST http://localhost:3000/action \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"$ACTION\",\"timestamp\":$TIMESTAMP,\"signature\":\"$SIGNATURE\"}"
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider:
- Adding rate limiting middleware
- Implementing request throttling
- Using a reverse proxy with rate limiting (e.g., nginx)

---

## HTTPS/SSL

For production deployment:

1. Obtain SSL certificate (Let's Encrypt, self-signed, etc.)
2. Configure server for HTTPS
3. Update Garmin app Server URL to use `https://`

**Example nginx reverse proxy config:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Webhook Support (Future Enhancement)

Future versions may support:
- Ring event webhooks (doorbell press, motion detection)
- Push notifications to watch
- Bidirectional communication

---

## API Versioning

Current version: `1.0.0`

Future versions may introduce:
- `/v2/action` endpoints
- Additional device actions
- Enhanced authentication methods
