# Future Enhancement: Ring Push Notifications

This document outlines how to add push notification support to receive Ring events on your Garmin watch.

## Current Implementation

The server currently runs continuously and maintains an active Ring session, but **does not** listen for or forward Ring events to the watch.

**Current capability:**
- ⌚ Watch → Server → Ring (unlock door)

**Not yet implemented:**
- 🔔 Ring → Server → Watch (doorbell pressed, motion detected)

## Why the Server Runs Continuously

Even without push notifications, the server runs continuously to:
- ✅ Maintain Ring API session
- ✅ Provide instant response to unlock requests
- ✅ Be ready for future notification support (this document)
- ✅ Ensure refresh tokens are updated properly

## Adding Push Notification Support

When you're ready to receive Ring events on your watch, here's what needs to be implemented:

### 1. Server-Side Changes

**Subscribe to Ring events** in `server/src/ring-client.ts`:

```typescript
async initialize(): Promise<void> {
  // ... existing code ...

  // Subscribe to doorbell events
  this.api.onDoorbellPressed.subscribe(event => {
    console.log('Doorbell pressed:', event);
    this.notifyWatch('doorbell', event);
  });

  // Subscribe to motion events
  this.api.onMotionDetected.subscribe(event => {
    console.log('Motion detected:', event);
    this.notifyWatch('motion', event);
  });
}

// New method to notify watch
private async notifyWatch(eventType: string, data: any): Promise<void> {
  // Option A: Store events, watch polls periodically
  // Option B: Use webhook to push to watch (if supported)
  // Option C: Use third-party push service
}
```

**Add notification endpoint** in `server/src/index.ts`:

```typescript
// Get pending notifications for watch
app.post('/notifications', verifySignature, async (req: Request, res: Response) => {
  try {
    const notifications = await notificationQueue.getPending();
    res.json({
      success: true,
      notifications
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Garmin Watch Changes

**Add polling timer** to check for notifications:

```monkey-c
// In RingControlApp.mc
function onStart(state) {
  // Start background timer to check for notifications every 5 minutes
  var timer = new Timer.Timer();
  timer.start(method(:checkNotifications), 300000, true); // 5 min
}

function checkNotifications() {
  // Make HTTP request to /notifications endpoint
  // Display alert if doorbell was pressed
}
```

**Add notification permissions** to `manifest.xml`:

```xml
<iq:permissions>
  <iq:uses-permission id="Communications"/>
  <iq:uses-permission id="Notifications"/> <!-- Add this -->
</iq:permissions>
```

### 3. Architecture Options

#### Option A: Polling (Simplest)
- Watch polls `/notifications` endpoint every 5 minutes
- Server stores recent events in memory/database
- ✅ Simple to implement
- ❌ Battery drain from frequent requests
- ❌ Delayed notifications (up to 5 min)

#### Option B: Webhooks (Better)
- Garmin doesn't support inbound webhooks directly
- Could use Garmin Connect IQ Cloud for notifications
- Requires Garmin developer account and app submission
- ✅ Real-time notifications
- ❌ Complex setup, app store approval needed

#### Option C: Push via Phone (Best)
- Use Garmin Connect mobile app as intermediary
- Ring → Server → Push to phone → Garmin Connect → Watch
- Requires custom phone app or service like Pushover
- ✅ Real-time, battery efficient
- ❌ Requires additional component

### 4. Recommended Approach

For this project, **Option A (Polling)** is recommended:

```typescript
// server/src/notification-queue.ts
class NotificationQueue {
  private queue: Array<{
    id: string;
    type: 'doorbell' | 'motion';
    timestamp: number;
    data: any;
  }> = [];

  add(type: string, data: any): void {
    this.queue.push({
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      data
    });

    // Keep only last 10 notifications
    if (this.queue.length > 10) {
      this.queue.shift();
    }
  }

  getPending(): Array<any> {
    // Return all unread notifications
    const pending = [...this.queue];
    this.queue = []; // Clear after reading
    return pending;
  }
}
```

### 5. Implementation Checklist

When ready to add notifications:

- [ ] Add `onDoorbellPressed` subscription to ring-client.ts
- [ ] Add `onMotionDetected` subscription to ring-client.ts
- [ ] Create notification queue system
- [ ] Add `/notifications` endpoint
- [ ] Update Garmin app with background timer
- [ ] Add notification display UI to watch
- [ ] Test end-to-end notification flow
- [ ] Update documentation

### 6. Battery Considerations

Polling every 5 minutes may impact watch battery:
- Adjust interval based on your needs (1 min = more drain, 15 min = less)
- Only poll during certain hours (e.g., 8am-10pm)
- Disable polling when watch detects you're home (if using GPS)

### 7. Testing

**Server-side:**
```bash
# Trigger test notification
curl -X POST http://localhost:3000/test/notification \
  -H "Content-Type: application/json" \
  -d '{"type":"doorbell"}'

# Check pending notifications
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{"action":"check","timestamp":...,"signature":"..."}'
```

**Watch-side:**
- Build and deploy updated app
- Wait for polling interval
- Press doorbell
- Verify notification appears on watch

## Resources

- [Ring Client API Events](https://github.com/dgreif/ring#events)
- [Garmin Connect IQ Background Services](https://developer.garmin.com/connect-iq/core-topics/background-processes/)
- [Garmin Connect IQ Cloud](https://developer.garmin.com/connect-iq/connect-iq-basics/companion-app-and-web-communication/)

---

**Note:** This is not yet implemented. The server is ready for it (running continuously), but you'll need to add the event subscriptions and watch polling when you're ready for notifications.
