// Ring Control View - UI Display
using Toybox.WatchUi;
using Toybox.Graphics;
using Toybox.System;
using Toybox.Application;

class RingControlView extends WatchUi.View {

    private var statusText;

    function initialize() {
        View.initialize();
        statusText = "Unlock Door";
    }

    // Load resources
    function onLayout(dc) {
        setLayout(Rez.Layouts.MainLayout(dc));
    }

    // Update the view
    function onUpdate(dc) {
        // Update status label
        var statusLabel = View.findDrawableById("statusLabel");
        if (statusLabel != null) {
            statusLabel.setText(statusText);
        }

        // Call parent's onUpdate to redraw the layout
        View.onUpdate(dc);
    }

    // Set status text from delegate
    function setStatus(text) {
        statusText = text;
        WatchUi.requestUpdate();
    }
}
