// Ads Management Configuration - NO DATABASE REQUIRED
// All configs stored using existing settings API

// Native Ads - In-Feed Style
export interface NativeAd {
  id: string;
  name: string;
  code: string; // HTML/JS code
  enabled: boolean;
  createdAt: string;
}

export interface NativeAdsConfig {
  enabled: boolean;
  ads: NativeAd[];
  frequency: number; // Show after every X cards
  rotationMode: 'sequential' | 'random';
}

// Display Banner Ads
export interface BannerAd {
  id: string;
  name: string;
  code: string; // HTML/JS code or image URL
  type: 'script' | 'image';
  imageUrl?: string;
  redirectUrl?: string;
  position: 'top' | 'below_header' | 'between_sections' | 'above_footer' | 'task_top' | 'task_bottom';
  device: 'all' | 'desktop' | 'mobile';
  isSticky: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface BannerAdsConfig {
  enabled: boolean;
  ads: BannerAd[];
  rotationMode: 'sequential' | 'random';
}

// Social Bar Ads - Floating monetization bar
export interface SocialBarConfig {
  enabled: boolean;
  ctaText: string;
  linkUrl: string;
  position: 'bottom' | 'side';
  device: 'all' | 'desktop' | 'mobile';
  pages: ('home' | 'task' | 'unlock' | 'shop' | 'rewards')[];
  dismissible: boolean;
  style: 'default' | 'minimal' | 'vibrant';
}

// Default configurations
export const DEFAULT_NATIVE_ADS_CONFIG: NativeAdsConfig = {
  enabled: false,
  ads: [],
  frequency: 4,
  rotationMode: 'random',
};

export const DEFAULT_BANNER_ADS_CONFIG: BannerAdsConfig = {
  enabled: false,
  ads: [],
  rotationMode: 'random',
};

export const DEFAULT_SOCIAL_BAR_CONFIG: SocialBarConfig = {
  enabled: false,
  ctaText: '🎁 Earn Free Rewards',
  linkUrl: '',
  position: 'bottom',
  device: 'all',
  pages: ['home', 'unlock'],
  dismissible: true,
  style: 'default',
};

// Settings keys for API
export const AD_CONFIG_KEYS = {
  NATIVE_ADS: 'native_ads_config',
  BANNER_ADS: 'banner_ads_config',
  SOCIAL_BAR: 'social_bar_ads_config',
};

// Ad rotation engine
let lastNativeAdIndex = -1;
let lastBannerAdIndex = -1;

export function getNextNativeAd(config: NativeAdsConfig): NativeAd | null {
  const enabledAds = config.ads.filter(ad => ad.enabled);
  if (enabledAds.length === 0) return null;

  if (config.rotationMode === 'sequential') {
    lastNativeAdIndex = (lastNativeAdIndex + 1) % enabledAds.length;
    return enabledAds[lastNativeAdIndex];
  }

  // Random mode - avoid showing same ad back-to-back
  if (enabledAds.length === 1) return enabledAds[0];
  
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * enabledAds.length);
  } while (nextIndex === lastNativeAdIndex && enabledAds.length > 1);
  
  lastNativeAdIndex = nextIndex;
  return enabledAds[nextIndex];
}

export function getNextBannerAd(config: BannerAdsConfig, position: BannerAd['position'], device: 'desktop' | 'mobile'): BannerAd | null {
  const eligibleAds = config.ads.filter(ad => 
    ad.enabled && 
    ad.position === position && 
    (ad.device === 'all' || ad.device === device)
  );
  
  if (eligibleAds.length === 0) return null;

  if (config.rotationMode === 'sequential') {
    lastBannerAdIndex = (lastBannerAdIndex + 1) % eligibleAds.length;
    return eligibleAds[lastBannerAdIndex];
  }

  // Random mode
  if (eligibleAds.length === 1) return eligibleAds[0];
  
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * eligibleAds.length);
  } while (nextIndex === lastBannerAdIndex && eligibleAds.length > 1);
  
  lastBannerAdIndex = nextIndex;
  return eligibleAds[nextIndex];
}

// Generate unique ID
export function generateAdId(): string {
  return `ad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
