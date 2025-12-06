/**
 * Security Configuration
 * Disables F12, Right Click, and other developer tool shortcuts.
 */

(function() {
    'use strict';

    // Disable Right Click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.onkeydown = function(e) {
        // F12
        if (e.keyCode == 123) {
            return false;
        }

        // Ctrl+Shift+I (Inspector)
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
            return false;
        }

        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
            return false;
        }

        // Ctrl+Shift+C (Element Inspector)
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
            return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
            return false;
        }
    };

    // Detect DevTools open
    // This is a basic detection method.
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            // Optional: Redirect or show warning if DevTools is detected
            // window.location.href = "about:blank";
            console.log('%cStop!', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cThis is a browser feature intended for developers.', 'font-size: 20px;');
        }
    });
    console.log(element);

})();
