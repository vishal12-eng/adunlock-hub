const POPUNDER_SCRIPT_SRC = 'https://pl28269726.effectivegatecpm.com/4a/58/28/4a582828c741cbec0d6df93c09739f14.js';

class PopunderManager {
  triggerPopunder(): boolean {
    try {
      // CRITICAL: window.open MUST be synchronous in click stack
      const pop = window.open('about:blank', '_blank');
      
      if (!pop) {
        // Popup blocked - continue silently
        return false;
      }

      // Open, write, close - proper document writing sequence
      pop.document.open();
      pop.document.write(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="${POPUNDER_SCRIPT_SRC}"></script>
  </head>
  <body></body>
</html>
      `);
      pop.document.close();

      // Focus back to main window
      try {
        window.focus();
      } catch {
        // Focus may fail in some browsers
      }

      return true;
    } catch {
      // Silently fail - don't break main flow
      return false;
    }
  }

  triggerPopunderSafe(event: React.MouseEvent | MouseEvent): boolean {
    event.preventDefault();
    event.stopPropagation();
    
    return this.triggerPopunder();
  }
}

export const popunderManager = new PopunderManager();
