import { useEffect, useRef, useState, memo } from 'react';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { getNextBannerAd, BannerAd } from '@/lib/ads/config';
import { useIsMobile } from '@/hooks/use-mobile';

interface DisplayBannerAdProps {
  position: BannerAd['position'];
  className?: string;
}

export const DisplayBannerAd = memo(function DisplayBannerAd({ 
  position, 
  className = '' 
}: DisplayBannerAdProps) {
  const { bannerAds, loading } = useAdsConfig();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<BannerAd | null>(null);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!loading && bannerAds.enabled) {
      const device = isMobile ? 'mobile' : 'desktop';
      const nextAd = getNextBannerAd(bannerAds, position, device);
      setAd(nextAd);
    }
  }, [loading, bannerAds, position, isMobile]);

  useEffect(() => {
    if (ad?.type === 'script' && containerRef.current) {
      try {
        containerRef.current.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = ad.code;
        
        // Execute scripts
        const scripts = wrapper.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = script.textContent;
          script.parentNode?.replaceChild(newScript, script);
        });
        
        containerRef.current.appendChild(wrapper);
      } catch (error) {
        console.error('Failed to render banner ad:', error);
        setHasError(true);
      }
    }
  }, [ad]);

  if (loading || !bannerAds.enabled || !ad || hasError) {
    return null;
  }

  const stickyClass = ad.isSticky ? 'sticky top-16 z-40' : '';

  // Image banner
  if (ad.type === 'image' && ad.imageUrl) {
    const content = (
      <img
        src={ad.imageUrl}
        alt="Advertisement"
        className={`w-full h-auto object-contain max-h-32 sm:max-h-40 transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );

    return (
      <div 
        className={`display-banner-ad ${stickyClass} ${className}`}
        data-ad-type="banner"
        data-ad-position={position}
      >
        {ad.redirectUrl ? (
          <a 
            href={ad.redirectUrl} 
            target="_blank" 
            rel="noopener noreferrer sponsored"
            className="block"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  }

  // Script banner
  return (
    <div 
      className={`display-banner-ad ${stickyClass} ${className}`}
      data-ad-type="banner"
      data-ad-position={position}
    >
      <div ref={containerRef} className="banner-ad-content" />
    </div>
  );
});

// Convenience components for specific positions
export function TopBanner({ className }: { className?: string }) {
  return <DisplayBannerAd position="top" className={className} />;
}

export function BelowHeaderBanner({ className }: { className?: string }) {
  return <DisplayBannerAd position="below_header" className={className} />;
}

export function BetweenSectionsBanner({ className }: { className?: string }) {
  return <DisplayBannerAd position="between_sections" className={className} />;
}

export function AboveFooterBanner({ className }: { className?: string }) {
  return <DisplayBannerAd position="above_footer" className={className} />;
}
