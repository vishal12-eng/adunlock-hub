import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePopunder } from '@/hooks/usePopunder';
import { ImageIcon } from 'lucide-react';

interface BannerSettings {
  enabled: boolean;
  imageUrl: string;
  redirectUrl: string;
}

interface AdvertisementBannerProps {
  className?: string;
}

export function AdvertisementBanner({ className = '' }: AdvertisementBannerProps) {
  const [settings, setSettings] = useState<BannerSettings>({
    enabled: false,
    imageUrl: '',
    redirectUrl: ''
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { triggerPopunder } = usePopunder();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.getSettings();
        setSettings({
          enabled: data.advertisement_banner_enabled === 'true',
          imageUrl: data.advertisement_banner_image_url || '',
          redirectUrl: data.advertisement_banner_redirect_url || ''
        });
      } catch {
        console.error('Failed to fetch banner settings');
      }
    }
    fetchSettings();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    triggerPopunder();
    
    if (!settings.redirectUrl) {
      e.preventDefault();
    }
  }, [settings.redirectUrl, triggerPopunder]);

  if (!settings.enabled) {
    return null;
  }

  const hasValidImage = settings.imageUrl && !imageError;

  const bannerContent = (
    <div 
      className={`relative overflow-hidden rounded-2xl glass border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer ${className}`}
      style={{ minHeight: '120px' }}
    >
      <div className="absolute top-2 left-2 z-10">
        <span className="px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded-md text-muted-foreground">
          Advertisement
        </span>
      </div>
      
      {hasValidImage ? (
        <img
          src={settings.imageUrl}
          alt="Advertisement"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ minHeight: '120px' }}
        />
      ) : (
        <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-gradient-to-br from-muted/50 to-secondary/50">
          <div className="text-center space-y-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">Advertisement Space</p>
          </div>
        </div>
      )}
      
      {hasValidImage && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );

  if (settings.redirectUrl) {
    return (
      <a
        href={settings.redirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block"
      >
        {bannerContent}
      </a>
    );
  }

  return (
    <div onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick(e as unknown as React.MouseEvent)}>
      {bannerContent}
    </div>
  );
}
