import { useState, useCallback, useEffect } from 'react';

const PAGES_BEFORE_AD = 2; // Show ad every X page views
const STORAGE_KEY = 'interstitialPageCount';

export function useInterstitialAd() {
  const [showAd, setShowAd] = useState(false);

  const incrementPageView = useCallback(() => {
    const currentCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
    const newCount = currentCount + 1;
    
    sessionStorage.setItem(STORAGE_KEY, String(newCount));

    if (newCount >= PAGES_BEFORE_AD) {
      setShowAd(true);
      sessionStorage.setItem(STORAGE_KEY, '0');
    }
  }, []);

  const closeAd = useCallback(() => {
    setShowAd(false);
  }, []);

  const triggerAd = useCallback(() => {
    setShowAd(true);
  }, []);

  return {
    showAd,
    incrementPageView,
    closeAd,
    triggerAd
  };
}
