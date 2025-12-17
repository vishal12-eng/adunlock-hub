import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ADSTERRA_SCRIPT_URL = 'https://pl28269726.effectivegatecpm.com/4a/58/28/4a582828c741cbec0d6df93c09739f14.js';
const SCRIPT_ID = 'adsterra-popunder-script';

// Routes where popunder should be enabled
const POPUNDER_ENABLED_ROUTES = ['/', '/unlock'];

function shouldEnablePopunder(pathname: string): boolean {
  return POPUNDER_ENABLED_ROUTES.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

export function AdsterraPopunder() {
  const location = useLocation();

  useEffect(() => {
    const isEnabled = shouldEnablePopunder(location.pathname);
    const existingScript = document.getElementById(SCRIPT_ID);

    if (isEnabled && !existingScript) {
      // Inject Adsterra popunder script
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'text/javascript';
      script.src = ADSTERRA_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    } else if (!isEnabled && existingScript) {
      // Remove script when navigating away from enabled routes
      existingScript.remove();
    }

    return () => {
      // Cleanup on unmount only if navigating to non-enabled route
      // Script persists during enabled routes for proper popunder behavior
    };
  }, [location.pathname]);

  // This component renders nothing - it only manages script injection
  return null;
}
