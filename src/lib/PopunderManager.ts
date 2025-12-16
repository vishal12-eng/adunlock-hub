const POPUNDER_LAST_SHOWN_KEY = 'adnexus_popunder_last_shown';

interface PopunderConfig {
  enabled: boolean;
  code: string;
  frequencyMinutes: number;
}

class PopunderManager {
  private config: PopunderConfig = {
    enabled: false,
    code: '',
    frequencyMinutes: 30
  };
  private triggerLock = false;
  private initialized = false;

  setConfig(config: PopunderConfig): void {
    this.config = config;
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  canShowPopunder(): boolean {
    if (!this.config.enabled || !this.config.code) {
      return false;
    }

    const lastShown = sessionStorage.getItem(POPUNDER_LAST_SHOWN_KEY);
    if (!lastShown) {
      return true;
    }

    const lastShownTime = parseInt(lastShown, 10);
    const now = Date.now();
    const frequencyMs = this.config.frequencyMinutes * 60 * 1000;

    return (now - lastShownTime) >= frequencyMs;
  }

  private recordPopunderShown(): void {
    sessionStorage.setItem(POPUNDER_LAST_SHOWN_KEY, Date.now().toString());
  }

  private extractDirectUrl(code: string): string | null {
    const trimmed = code.trim();
    if (/^https?:\/\/[^\s<>"]+$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  private extractUrlsFromCode(code: string): string[] {
    const urls: string[] = [];
    
    const srcMatch = code.match(/<script[^>]+src=["']([^"']+)["']/gi);
    if (srcMatch) {
      srcMatch.forEach(match => {
        const urlMatch = match.match(/src=["']([^"']+)["']/i);
        if (urlMatch && urlMatch[1]) {
          urls.push(urlMatch[1]);
        }
      });
    }
    
    const inlineUrls = code.match(/https?:\/\/[^\s"'<>]+/g);
    if (inlineUrls) {
      urls.push(...inlineUrls);
    }
    
    return [...new Set(urls)];
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

  private executeInIsolatedContext(code: string): boolean {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ad</title>
  <script>
    (function() {
      window.onerror = function() { return true; };
      
      var noop = function() {};
      
      try {
        Object.defineProperty(document, 'write', {
          value: noop,
          writable: false,
          configurable: false
        });
      } catch(e) { document.write = noop; }
      
      try {
        Object.defineProperty(document, 'writeln', {
          value: noop,
          writable: false,
          configurable: false
        });
      } catch(e) { document.writeln = noop; }
    })();
  </script>
</head>
<body style="margin:0;padding:0;">
  ${code}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      const popunderWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);
      
      if (popunderWindow) {
        try {
          window.focus();
        } catch {
          // Focus may fail
        }
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private executeViaSandboxedIframe(code: string): boolean {
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
      
      try {
        Object.defineProperty(window, 'top', {
          value: window,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      try {
        Object.defineProperty(window, 'parent', {
          value: window,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      try {
        Object.defineProperty(window, 'opener', {
          value: null,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
      try {
        Object.defineProperty(window, 'frameElement', {
          value: null,
          writable: false,
          configurable: false
        });
      } catch(e) {}
      
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
  ${code}
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
    if (this.triggerLock) {
      return false;
    }

    if (!this.canShowPopunder()) {
      return false;
    }

    this.triggerLock = true;
    let success = false;

    try {
      const code = this.config.code.trim();
      
      const directUrl = this.extractDirectUrl(code);
      if (directUrl) {
        success = this.openPopunderWindow(directUrl);
        if (success) {
          this.recordPopunderShown();
        }
        setTimeout(() => { this.triggerLock = false; }, 1000);
        return success;
      }
      
      const urls = this.extractUrlsFromCode(code);
      
      const popunderUrl = urls.find(url => 
        url.includes('popunder') || 
        url.includes('/pop/') || 
        url.includes('pop.') ||
        url.includes('srv.') ||
        url.includes('ad.') ||
        url.includes('profitablecpm') ||
        url.includes('adsterra') ||
        url.includes('propellerads')
      );
      
      if (popunderUrl) {
        success = this.openPopunderWindow(popunderUrl);
        if (success) {
          this.recordPopunderShown();
          setTimeout(() => { this.triggerLock = false; }, 1000);
          return success;
        }
      }
      
      if (code.includes('<script')) {
        success = this.executeViaSandboxedIframe(code);
        
        if (!success) {
          success = this.executeInIsolatedContext(code);
        }
        
        if (success) {
          this.recordPopunderShown();
        }
      } else if (urls.length > 0) {
        success = this.openPopunderWindow(urls[0]);
        if (success) {
          this.recordPopunderShown();
        }
      }

    } catch (error) {
      console.warn('Popunder execution failed:', error);
    } finally {
      setTimeout(() => {
        this.triggerLock = false;
      }, 1000);
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
