import { useState, useEffect, memo } from 'react';
import { X, Gift, ExternalLink, ChevronRight } from 'lucide-react';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const DISMISS_KEY = 'adnexus_social_bar_dismissed';

function isDismissed(): boolean {
  const dismissed = sessionStorage.getItem(DISMISS_KEY);
  return dismissed === 'true';
}

export const SocialBar = memo(function SocialBar() {
  const { socialBar, loading } = useAdsConfig();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Determine current page
  const currentPage = (() => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.includes('/unlock/')) return 'unlock';
    if (path === '/shop') return 'shop';
    if (path === '/rewards') return 'rewards';
    return 'home';
  })() as 'home' | 'task' | 'unlock' | 'shop' | 'rewards';

  useEffect(() => {
    if (loading) return;
    
    // Check if should be visible
    const shouldShow = 
      socialBar.enabled &&
      !isDismissed() &&
      socialBar.pages.includes(currentPage) &&
      socialBar.linkUrl &&
      (socialBar.device === 'all' || 
       (socialBar.device === 'mobile' && isMobile) ||
       (socialBar.device === 'desktop' && !isMobile));

    if (shouldShow) {
      // Delay animation for smooth appearance
      setTimeout(() => {
        setVisible(true);
        setTimeout(() => setAnimateIn(true), 50);
      }, 1000);
    } else {
      setVisible(false);
      setAnimateIn(false);
    }
  }, [loading, socialBar, currentPage, isMobile]);

  const handleDismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }, 300);
  };

  if (!visible) return null;

  const positionClasses = {
    bottom: 'bottom-0 left-0 right-0 flex-row',
    side: 'right-4 bottom-20 flex-col',
  };

  const styleClasses = {
    default: 'bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-md',
    minimal: 'bg-background/95 border border-border backdrop-blur-md',
    vibrant: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
  };

  const textClasses = {
    default: 'text-primary-foreground',
    minimal: 'text-foreground',
    vibrant: 'text-white',
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        positionClasses[socialBar.position]
      } ${
        animateIn 
          ? 'translate-y-0 opacity-100' 
          : socialBar.position === 'bottom' 
            ? 'translate-y-full opacity-0' 
            : 'translate-x-full opacity-0'
      }`}
    >
      <div 
        className={`${styleClasses[socialBar.style]} ${
          socialBar.position === 'bottom' 
            ? 'w-full px-4 py-3' 
            : 'rounded-xl px-4 py-3 shadow-lg'
        }`}
      >
        <div className={`flex items-center justify-between gap-3 ${
          socialBar.position === 'side' ? 'flex-col' : ''
        }`}>
          <a
            href={socialBar.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`flex items-center gap-2 ${textClasses[socialBar.style]} hover:opacity-90 transition-opacity flex-1`}
          >
            <Gift className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm truncate">
              {socialBar.ctaText}
            </span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </a>
          
          {socialBar.dismissible && (
            <button
              onClick={handleDismiss}
              className={`${textClasses[socialBar.style]} opacity-70 hover:opacity-100 transition-opacity p-1`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
