# Ring Control - Garmin Watch App

A Garmin Connect IQ app that allows you to unlock your Ring intercom from your smartwatch.

## Features

- One-touch door unlock from your Garmin watch
- Secure HMAC-SHA256 signed requests
- Real-time status feedback
- Configurable server URL and shared secret

## Supported Devices

This app supports most modern Garmin smartwatches including:
- Fenix 5/6/7 series
- Forerunner 245/945 series
- Vivoactive 3/4 series
- And more (see manifest.xml for full list)

## Building the App

### Prerequisites

1. Install [Garmin Connect IQ SDK](https://developer.garmin.com/connect-iq/sdk/)
2. Install [Visual Studio Code](https://code.visualstudio.com/) with Monkey C extension (recommended)

### Build Instructions

#### Using Connect IQ SDK Manager

1. Open the project in Visual Studio Code
2. Select your target device from the device dropdown
3. Build: `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (Mac)
4. Run in simulator: Press F5

#### Using Command Line

```bash
# Build for a specific device
monkeyc -f monkey.jungle -d fenix6 -o ring-control.prg -y /path/to/developer_key

# Run in simulator
connectiq
```

## Installation

### Via Connect IQ Store (Future)
Once published, you can install directly from the Connect IQ Store on your watch.

### Via Sideloading (Development)

1. Build the app (produces a `.prg` file)
2. Connect your Garmin watch to your computer
3. Copy the `.prg` file to `GARMIN/APPS` folder on your watch
4. Disconnect and restart the watch
5. The app will appear in your app list

## Configuration

After installing the app, you need to configure it:

### On Your Watch

1. Long press on the watch face
2. Select "Settings"
3. Scroll to "Apps"
4. Find "Ring Control"
5. Configure:
   - **Server URL**: Your Ring server URL (e.g., `http://192.168.1.100:3000`)
   - **Shared Secret**: The secret from `docker-compose run --rm ring-server node scripts/generate-secret.js`

### Via Garmin Connect Mobile App

1. Open Garmin Connect app
2. Go to "Devices" > Your Watch
3. Select "Apps"
4. Tap "Ring Control"
5. Tap "Settings"
6. Enter your Server URL and Shared Secret

### Via Garmin Express (Desktop)

1. Connect watch to computer
2. Open Garmin Express
3. Select your device
4. Go to "Apps"
5. Click settings icon on "Ring Control"
6. Enter configuration

## Usage

1. Open the Ring Control app on your watch
2. Press the SELECT button (middle right button on most watches)
3. Wait for confirmation
4. The door will unlock!

## Network Requirements

- Your Garmin watch must be connected to WiFi or have LTE
- The server must be accessible from your watch's network
- If using WiFi, your watch and server should be on the same network (or server must be publicly accessible)

## Troubleshooting

### "Not Configured" Message
- Ensure Server URL and Shared Secret are set in app settings
- Check that values were saved correctly

### "Network Error"
- Verify your watch is connected to WiFi or LTE
- Check that the server URL is correct and accessible
- Ensure the server is running: `curl http://your-server:3000/health`

### "Auth Failed"
- Shared secret mismatch - verify the secret matches the server
- Clock skew - ensure watch time is accurate (syncs automatically)

### "Failed" Message
- Check server logs for errors
- Verify the selected Ring device is online
- Try re-authenticating the server with Ring

## Security Notes

- The shared secret should be kept private
- Requests are signed with HMAC-SHA256 to prevent tampering
- Timestamp validation prevents replay attacks (5-minute window)
- Use HTTPS for production deployments (requires SSL certificate)

## Development

### Project Structure

```
garmin/
├── manifest.xml          # App manifest and device support
├── monkey.jungle         # Project configuration
├── resources/
│   ├── strings.xml      # Localized strings
│   ├── layouts.xml      # UI layouts
│   ├── drawables.xml    # Icons and images
│   └── settings.xml     # App settings definition
└── source/
    ├── RingControlApp.mc      # Main app entry point
    ├── RingControlView.mc     # UI view
    ├── RingControlDelegate.mc # Input handling and networking
    └── HmacSha256.mc          # HMAC signature utility
```

### Testing

Use the simulator for basic testing:
```bash
# Run in simulator
monkeydo ring-control.prg fenix6
```

For network testing, you'll need to test on an actual device.

## License

See main project LICENSE file.
