// Ring Control App - Main Application
using Toybox.Application;
using Toybox.WatchUi;

class RingControlApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    // Return initial view
    function getInitialView() {
        return [new RingControlView(), new RingControlDelegate()];
    }

    // Handle app settings changes
    function onSettingsChanged() {
        WatchUi.requestUpdate();
    }
}
