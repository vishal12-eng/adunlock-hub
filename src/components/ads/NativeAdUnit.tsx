import { useEffect, useRef, useState, memo } from 'react';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { getNextNativeAd, NativeAd } from '@/lib/ads/config';

interface NativeAdUnitProps {
  className?: string;
}

export const NativeAdUnit = memo(function NativeAdUnit({ className = '' }: NativeAdUnitProps) {
  const { nativeAds, loading } = useAdsConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<NativeAd | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!loading && nativeAds.enabled) {
      const nextAd = getNextNativeAd(nativeAds);
      setAd(nextAd);
    }
  }, [loading, nativeAds]);

  useEffect(() => {
    if (ad && containerRef.current) {
      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Create a wrapper for the ad
        const wrapper = document.createElement('div');
        wrapper.innerHTML = ad.code;
        
        // Execute any scripts
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
        console.error('Failed to render native ad:', error);
        setHasError(true);
      }
    }
  }, [ad]);

  if (loading || !nativeAds.enabled || !ad || hasError) {
    return null;
  }

  return (
    <div 
      className={`native-ad-unit glass rounded-xl overflow-hidden ${className}`}
      data-ad-type="native"
    >
      <div className="text-[10px] text-muted-foreground/60 px-3 py-1 border-b border-border/50">
        Sponsored
      </div>
      <div 
        ref={containerRef} 
        className="native-ad-content p-3"
      />
    </div>
  );
});

// Wrapper component for in-feed placement
interface NativeAdPlacementProps {
  index: number;
  className?: string;
}

export function NativeAdPlacement({ index, className }: NativeAdPlacementProps) {
  const { nativeAds, loading } = useAdsConfig();
  
  // Check if we should show an ad at this index
  if (loading || !nativeAds.enabled || nativeAds.frequency === 0) {
    return null;
  }
  
  // Show ad after every X items (frequency)
  if ((index + 1) % nativeAds.frequency !== 0) {
    return null;
  }

  return <NativeAdUnit className={className} />;
}
