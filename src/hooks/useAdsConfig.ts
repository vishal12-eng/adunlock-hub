import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  NativeAdsConfig,
  BannerAdsConfig,
  SocialBarConfig,
  DEFAULT_NATIVE_ADS_CONFIG,
  DEFAULT_BANNER_ADS_CONFIG,
  DEFAULT_SOCIAL_BAR_CONFIG,
  AD_CONFIG_KEYS,
} from '@/lib/ads/config';

interface AdsConfigState {
  nativeAds: NativeAdsConfig;
  bannerAds: BannerAdsConfig;
  socialBar: SocialBarConfig;
  loading: boolean;
}

// Cache for performance
let cachedConfig: AdsConfigState | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export function useAdsConfig() {
  const [config, setConfig] = useState<AdsConfigState>(() => 
    cachedConfig || {
      nativeAds: DEFAULT_NATIVE_ADS_CONFIG,
      bannerAds: DEFAULT_BANNER_ADS_CONFIG,
      socialBar: DEFAULT_SOCIAL_BAR_CONFIG,
      loading: true,
    }
  );

  const fetchConfig = useCallback(async (force = false) => {
    // Use cache if available and not expired
    if (!force && cachedConfig && Date.now() - lastFetchTime < CACHE_DURATION) {
      setConfig(cachedConfig);
      return;
    }

    try {
      const settings = await api.getSettings();
      
      const nativeAds: NativeAdsConfig = settings[AD_CONFIG_KEYS.NATIVE_ADS]
        ? JSON.parse(settings[AD_CONFIG_KEYS.NATIVE_ADS])
        : DEFAULT_NATIVE_ADS_CONFIG;

      const bannerAds: BannerAdsConfig = settings[AD_CONFIG_KEYS.BANNER_ADS]
        ? JSON.parse(settings[AD_CONFIG_KEYS.BANNER_ADS])
        : DEFAULT_BANNER_ADS_CONFIG;

      const socialBar: SocialBarConfig = settings[AD_CONFIG_KEYS.SOCIAL_BAR]
        ? JSON.parse(settings[AD_CONFIG_KEYS.SOCIAL_BAR])
        : DEFAULT_SOCIAL_BAR_CONFIG;

      const newConfig = {
        nativeAds,
        bannerAds,
        socialBar,
        loading: false,
      };

      cachedConfig = newConfig;
      lastFetchTime = Date.now();
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to fetch ads config:', error);
      setConfig(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    ...config,
    refetch: () => fetchConfig(true),
  };
}

// Hook for admin panel to update configs
export function useAdsConfigAdmin() {
  const [saving, setSaving] = useState(false);

  const saveNativeAdsConfig = async (config: NativeAdsConfig) => {
    setSaving(true);
    try {
      await api.admin.updateSettings({
        [AD_CONFIG_KEYS.NATIVE_ADS]: JSON.stringify(config),
      });
      cachedConfig = null; // Invalidate cache
      return true;
    } catch (error) {
      console.error('Failed to save native ads config:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBannerAdsConfig = async (config: BannerAdsConfig) => {
    setSaving(true);
    try {
      await api.admin.updateSettings({
        [AD_CONFIG_KEYS.BANNER_ADS]: JSON.stringify(config),
      });
      cachedConfig = null;
      return true;
    } catch (error) {
      console.error('Failed to save banner ads config:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSocialBarConfig = async (config: SocialBarConfig) => {
    setSaving(true);
    try {
      await api.admin.updateSettings({
        [AD_CONFIG_KEYS.SOCIAL_BAR]: JSON.stringify(config),
      });
      cachedConfig = null;
      return true;
    } catch (error) {
      console.error('Failed to save social bar config:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    saveNativeAdsConfig,
    saveBannerAdsConfig,
    saveSocialBarConfig,
  };
}
