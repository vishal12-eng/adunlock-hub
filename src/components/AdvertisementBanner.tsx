import { useEffect, useRef } from 'react';

interface AdvertisementBannerProps {
  className?: string;
}

export function AdvertisementBanner({ className = '' }: AdvertisementBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isLoaded.current) {
      isLoaded.current = true;
      
      // Create the atOptions script
      const optionsScript = document.createElement('script');
      optionsScript.textContent = `
        atOptions = {
          'key' : '930770bbbbdf63e751b7e613e1c40d1e',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      containerRef.current.appendChild(optionsScript);
      
      // Load the banner ad script
      const script = document.createElement('script');
      script.src = 'https://passivealexis.com/930770bbbbdf63e751b7e613e1c40d1e/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`banner-ad-container flex items-center justify-center ${className}`}
      data-ad-type="banner"
    />
  );
}
