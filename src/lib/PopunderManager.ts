const POPUNDER_SCRIPT_SRC = 'https://pl28269726.effectivegatecpm.com/4a/58/28/4a582828c741cbec0d6df93c09739f14.js';

class PopunderManager {
  triggerPopunder(): boolean {
    try {
      // Create HTML content with the Adsterra script
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loading...</title>
</head>
<body>
  <script type="text/javascript" src="${POPUNDER_SCRIPT_SRC}"></script>
</body>
</html>`;

      // Create a Blob URL - this works reliably on mobile
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      // CRITICAL: window.open MUST be synchronous in click stack
      const popWin = window.open(blobUrl, '_blank');

      // Revoke the blob URL after a delay to free memory
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);

      if (!popWin) {
        // Popup blocked - continue silently
        return false;
      }

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
