// Ads Discount System - NO DATABASE REQUIRED
// Users can spend coins to reduce the number of ads required

import { getShopConfig } from './config';
import { addTransaction } from './transactions';

const ADS_DISCOUNT_SESSION_KEY = 'adnexus_ads_discount_session';

interface AdsDiscountSession {
  contentId: string;
  originalAds: number;
  discountedAds: number;
  coinsSpent: number;
  adsReduced: number;
  appliedAt: number;
}

// Get current discount session
export function getAdsDiscountSession(contentId: string): AdsDiscountSession | null {
  try {
    const stored = sessionStorage.getItem(ADS_DISCOUNT_SESSION_KEY);
    if (stored) {
      const sessions: AdsDiscountSession[] = JSON.parse(stored);
      return sessions.find(s => s.contentId === contentId) || null;
    }
  } catch {}
  return null;
}

// Save discount session
function saveAdsDiscountSession(session: AdsDiscountSession): void {
  try {
    const stored = sessionStorage.getItem(ADS_DISCOUNT_SESSION_KEY);
    let sessions: AdsDiscountSession[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing session for this content
    sessions = sessions.filter(s => s.contentId !== session.contentId);
    sessions.push(session);
    
    sessionStorage.setItem(ADS_DISCOUNT_SESSION_KEY, JSON.stringify(sessions));
  } catch {}
}

// Calculate discount options
export function calculateDiscountOptions(
  originalAds: number,
  currentCoins: number
): { adsToReduce: number; coinsRequired: number; finalAds: number }[] {
  const config = getShopConfig();
  const options: { adsToReduce: number; coinsRequired: number; finalAds: number }[] = [];
  
  const maxDiscount = Math.min(
    originalAds - 1, // Must have at least 1 ad
    config.maxAdsDiscountPerSession
  );
  
  // Generate options: 1 ad, 2 ads, 3 ads, etc.
  for (let adsToReduce = 1; adsToReduce <= maxDiscount; adsToReduce++) {
    const coinsRequired = adsToReduce * config.coinsPerAdDiscount;
    if (coinsRequired <= currentCoins) {
      options.push({
        adsToReduce,
        coinsRequired,
        finalAds: originalAds - adsToReduce,
      });
    }
  }
  
  return options;
}

// Apply ads discount
export function applyAdsDiscount(
  contentId: string,
  originalAds: number,
  adsToReduce: number,
  contentTitle?: string
): {
  success: boolean;
  discountedAds: number;
  coinsSpent: number;
  message: string;
} {
  const config = getShopConfig();
  const coinsRequired = adsToReduce * config.coinsPerAdDiscount;
  
  // Validate
  if (adsToReduce > originalAds - 1) {
    return {
      success: false,
      discountedAds: originalAds,
      coinsSpent: 0,
      message: 'Cannot reduce all ads',
    };
  }
  
  if (adsToReduce > config.maxAdsDiscountPerSession) {
    return {
      success: false,
      discountedAds: originalAds,
      coinsSpent: 0,
      message: `Maximum ${config.maxAdsDiscountPerSession} ads can be discounted`,
    };
  }
  
  const discountedAds = originalAds - adsToReduce;
  
  // Save session
  const session: AdsDiscountSession = {
    contentId,
    originalAds,
    discountedAds,
    coinsSpent: coinsRequired,
    adsReduced: adsToReduce,
    appliedAt: Date.now(),
  };
  saveAdsDiscountSession(session);
  
  // Record transaction
  addTransaction(
    'ad_discount',
    `Reduced ${adsToReduce} ads for ${coinsRequired} coins`,
    -coinsRequired,
    0,
    contentId,
    contentTitle,
    { adsDiscounted: adsToReduce, originalAds, finalAds: discountedAds }
  );
  
  return {
    success: true,
    discountedAds,
    coinsSpent: coinsRequired,
    message: `Reduced to ${discountedAds} ads!`,
  };
}

// Get effective ads count (with discount applied)
export function getEffectiveAdsCount(contentId: string, originalAds: number): number {
  const session = getAdsDiscountSession(contentId);
  if (session && session.contentId === contentId) {
    return session.discountedAds;
  }
  return originalAds;
}

// Clear discount session for content
export function clearAdsDiscountSession(contentId: string): void {
  try {
    const stored = sessionStorage.getItem(ADS_DISCOUNT_SESSION_KEY);
    if (stored) {
      let sessions: AdsDiscountSession[] = JSON.parse(stored);
      sessions = sessions.filter(s => s.contentId !== contentId);
      sessionStorage.setItem(ADS_DISCOUNT_SESSION_KEY, JSON.stringify(sessions));
    }
  } catch {}
}
