import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className = '' }: AdBannerProps) {
  const [smartlink, setSmartlink] = useState<string>('');

  useEffect(() => {
    async function fetchSmartlink() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'adsterra_smartlink')
        .maybeSingle();
      
      if (data?.value) {
        setSmartlink(data.value);
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
