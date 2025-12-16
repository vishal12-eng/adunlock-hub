const POPUNDER_SCRIPT_SRC = 'https://pl28269726.effectivegatecpm.com/4a/58/28/4a582828c741cbec0d6df93c09739f14.js';

class PopunderManager {
  triggerPopunder(): boolean {
    try {
      // CRITICAL: window.open MUST be the first synchronous call in click stack
      const popWin = window.open('about:blank', '_blank');
      
      if (!popWin) {
        // Popup blocked - continue silently
        return false;
      }

      // Inject Adsterra script into the opened window
      popWin.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Loading...</title>
</head>
<body>
  <script src="${POPUNDER_SCRIPT_SRC}"></script>
</body>
</html>
      `);
      popWin.document.close();

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
