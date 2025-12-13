import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className = '' }: AdBannerProps) {
  const [smartlink, setSmartlink] = useState<string>('');

  useEffect(() => {
    async function fetchSmartlink() {
      try {
        const { value } = await api.getSetting('adsterra_smartlink');
        if (value) {
          setSmartlink(value);
        }
      } catch {
        // Setting not found, leave empty
      }
    }
    fetchSmartlink();
  }, []);

  if (!smartlink) {
    return (
      <div className={`glass rounded-xl p-4 flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Advertisement Space</p>
          <p className="text-xs text-muted-foreground/60">Configure ads in admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <a 
      href={smartlink}
      target="_blank"
      rel="noopener noreferrer"
      className={`block glass rounded-xl p-4 hover:border-primary/30 transition-colors ${className}`}
    >
      <div className="text-center space-y-2">
        <div className="w-full h-24 bg-gradient-to-br from-muted to-secondary rounded-lg flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">Sponsored Content</span>
        </div>
      </div>
    </a>
  );
}
