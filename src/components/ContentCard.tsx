import { Lock, Eye, Download } from 'lucide-react';

interface ContentCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  requiredAds: number;
  views: number;
  unlocks: number;
  onClick: () => void;
}

export function ContentCard({
  title,
  description,
  thumbnailUrl,
  requiredAds,
  views,
  unlocks,
  onClick
}: ContentCardProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    onClick();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="content-card rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Lock className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
        
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 glass rounded-full">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">{requiredAds} Ads</span>
        </div>
        
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span>{views}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="w-3.5 h-3.5" />
            <span>{unlocks}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="pt-2">
          <span className="text-xs font-medium text-primary flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Click to unlock
          </span>
        </div>
      </div>
    </div>
  );
}
