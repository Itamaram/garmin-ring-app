// Ring Control Delegate - Handle user input and network communication
using Toybox.WatchUi;
using Toybox.Communications;
using Toybox.System;
using Toybox.Application;
using Toybox.StringUtil;

class RingControlDelegate extends WatchUi.BehaviorDelegate {

    private var view;

    function initialize() {
        BehaviorDelegate.initialize();
    }

    // Handle SELECT button press
    function onSelect() {
        unlockDoor();
        return true;
    }

    // Send unlock request to server
    function unlockDoor() {
        // Get settings
        var serverUrl = Application.Properties.getValue("ServerUrl");
        var sharedSecret = Application.Properties.getValue("SharedSecret");

        // Validate configuration
        if (serverUrl == null || serverUrl.equals("")) {
            System.println("Server URL not configured");
            updateStatus("Not Configured");
            return;
        }

        if (sharedSecret == null || sharedSecret.equals("")) {
            System.println("Shared secret not configured");
            updateStatus("Not Configured");
            return;
        }

        updateStatus("Unlocking...");

        // Build signed request
        var action = "unlock";
        var timestamp = System.getTimer() / 1000; // Convert to seconds

        // Create signature: HMAC-SHA256(action + timestamp, sharedSecret)
        var message = action + timestamp.toString();
        var signature = HmacSha256.compute(message, sharedSecret);

        // Build request payload
        var payload = {
            "action" => action,
            "timestamp" => timestamp,
            "signature" => signature
        };

        // Build full URL
        var url = serverUrl;
        if (!url.find("/action")) {
            if (!url.substring(url.length() - 1, url.length()).equals("/")) {
                url += "/";
            }
            url += "action";
        }

        System.println("Sending request to: " + url);
        System.println("Payload: " + payload.toString());

        // Send HTTP POST request
        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_POST,
            :headers => {
                "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON
            },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        Communications.makeWebRequest(
            url,
            payload,
            options,
            method(:onReceive)
        );
    }

    // Handle server response
    function onReceive(responseCode, data) {
        System.println("Response code: " + responseCode);
        System.println("Response data: " + data);

        if (responseCode == 200) {
            // Success
            if (data != null && data["success"]) {
                updateStatus("Door Unlocked!");
                // Reset status after 3 seconds
                var timer = new Timer.Timer();
                timer.start(method(:resetStatus), 3000, false);
            } else {
                var message = "Failed";
                if (data != null && data["message"]) {
                    message = data["message"];
                }
                updateStatus(message);
            }
        } else if (responseCode == 401) {
            updateStatus("Auth Failed");
        } else if (responseCode == -104 || responseCode == -103) {
            updateStatus("Network Error");
        } else {
            updateStatus("Error: " + responseCode);
        }
    }

    // Update status on view
    function updateStatus(text) {
        var view = WatchUi.getView();
        if (view != null && view has :setStatus) {
            view.setStatus(text);
        }
    }

    // Reset status to default
    function resetStatus() {
        updateStatus("Unlock Door");
    }
}
