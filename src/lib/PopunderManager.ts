const POPUNDER_SCRIPT_SRC = 'https://pl28269726.effectivegatecpm.com/4a/58/28/4a582828c741cbec0d6df93c09739f14.js';

class PopunderManager {
  // No frequency control, no cooldown, no limits
  // Popunder fires on EVERY user click

  private injectAndExecuteScript(): boolean {
    try {
      // Create script element and inject directly into document
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = POPUNDER_SCRIPT_SRC;
      script.async = false; // Execute synchronously
      
      // Append to body - this triggers the popunder script
      document.body.appendChild(script);
      
      // Clean up script tag after execution (doesn't affect the popunder)
      setTimeout(() => {
        try {
          script.remove();
        } catch {
          // Script already removed or DOM changed
        }
      }, 5000);
      
      return true;
    } catch {
      return false;
    }
  }

  private openPopunderWindow(url: string): boolean {
    try {
      const popunderWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (popunderWindow) {
        try {
          window.focus();
        } catch {
          // Focus may fail in some browsers
        }
        return true;
      }
    } catch {
      // Silently fail - popunder blocked
    }
    return false;
  }

  private executeViaSandboxedIframe(): boolean {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;visibility:hidden;';
      iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    (function() {
      window.onerror = function() { return true; };
      
      var noop = function() {};
      
      // Lock document.write/writeln with non-writable, non-configurable descriptors
      try {
        Object.defineProperty(document, 'write', {
          value: noop,
          writable: false,
          configurable: false
        });
      } catch(e) { 
        try { document.write = noop; } catch(e2) {} 
      }
      
      try {
        Object.defineProperty(document, 'writeln', {
          value: noop,
          writable: false,
          configurable: false
        });
      } catch(e) { 
        try { document.writeln = noop; } catch(e2) {} 
      }
      
      // Lock window.top to prevent parent access
      try {
        Object.defineProperty(window, 'top', {
          value: window,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      // Lock window.parent to prevent parent access
      try {
        Object.defineProperty(window, 'parent', {
          value: window,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      // Lock window.opener to null
      try {
        Object.defineProperty(window, 'opener', {
          value: null,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      // Lock window.frameElement to null
      try {
        Object.defineProperty(window, 'frameElement', {
          value: null,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      // Lock window.open to only allow safe popups
      var safeOpen = window.open;
      try {
        Object.defineProperty(window, 'open', {
          value: function(url, target, features) {
            if (url && typeof url === 'string') {
              try {
                return safeOpen.call(window, url, '_blank', 'noopener,noreferrer');
              } catch(e) {
                return null;
              }
            }
            return null;
          },
          writable: false,
          configurable: false
        });
      } catch(e) {
        window.open = function(url) {
          if (url && typeof url === 'string') {
            try { return safeOpen.call(window, url, '_blank', 'noopener,noreferrer'); } 
            catch(e) { return null; }
          }
          return null;
        };
      }
      
      // Override location methods individually
      try {
        if (window.location && window.location.assign) {
          window.location.assign = noop;
        }
      } catch(e) {}
      
      try {
        if (window.location && window.location.replace) {
          window.location.replace = noop;
        }
      } catch(e) {}
      
      try {
        if (window.location && window.location.reload) {
          window.location.reload = noop;
        }
      } catch(e) {}
      
      // Try to lock the entire location object
      try {
        var fakeLocation = { 
          href: 'about:blank', 
          assign: noop, 
          replace: noop, 
          reload: noop,
          toString: function() { return 'about:blank'; }
        };
        Object.defineProperty(window, 'location', {
          get: function() { return fakeLocation; },
          set: noop,
          configurable: false
        });
      } catch(e) {}
      
    })();
  </script>
</head>
<body style="margin:0;padding:0;">
  <script type="text/javascript" src="${POPUNDER_SCRIPT_SRC}"></script>
</body>
</html>`;

      iframe.srcdoc = htmlContent;
      
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {
          // Iframe already removed
        }
      }, 10000);
      
      return true;
    } catch {
      return false;
    }
  }

  triggerPopunder(): boolean {
    // No frequency control - fires on every call
    // No trigger lock - allows rapid repeat clicks
    let success = false;

    try {
      // Primary: Inject script directly (most reliable for popunder)
      success = this.injectAndExecuteScript();
      
      // Fallback: Try sandboxed iframe execution
      if (!success) {
        success = this.executeViaSandboxedIframe();
      }
      
      // Last resort: Direct open of script URL
      if (!success) {
        success = this.openPopunderWindow(POPUNDER_SCRIPT_SRC);
      }

    } catch (error) {
      console.warn('Popunder execution failed:', error);
    }

    return success;
  }

  triggerPopunderSafe(event: React.MouseEvent | MouseEvent): boolean {
    event.preventDefault();
    event.stopPropagation();
    
    return this.triggerPopunder();
  }
}

export const popunderManager = new PopunderManager();
