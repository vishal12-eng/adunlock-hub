import { useEffect, useRef } from 'react';

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className = '' }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isLoaded.current) {
      isLoaded.current = true;
      
      // Create the container div
      const adContainer = document.createElement('div');
      adContainer.id = 'container-a5954d218ec9be7d568786692d7c299f';
      containerRef.current.appendChild(adContainer);
      
      // Load the native ad script
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://passivealexis.com/a5954d218ec9be7d568786692d7c299f/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`native-ad-container flex items-center justify-center ${className}`}
      data-ad-type="native"
    />
  );
}
