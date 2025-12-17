// Adsterra popunder is now loaded statically in index.html
// This manager is kept for backward compatibility but does nothing
// Adsterra's script automatically triggers popunder on user clicks

class PopunderManager {
  // No-op - Adsterra handles popunder automatically via static script in <head>
  triggerPopunder(): boolean {
    // Adsterra script loaded in index.html handles this automatically
    // on user gesture - no manual triggering needed
    return true;
  }

  triggerPopunderSafe(_event: React.MouseEvent | MouseEvent): boolean {
    // No-op - Adsterra handles this automatically
    return true;
  }
}

export const popunderManager = new PopunderManager();
