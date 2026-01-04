import { X, Lock, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getSessionId } from '@/lib/session';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    requiredAds: number;
  };
}

export function UnlockModal({ isOpen, onClose, content }: UnlockModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  async function handleStartTask(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Adsterra popunder triggers automatically on click via injected script
    // No manual triggering needed
    
    const sessionId = getSessionId();

    try {
      const existingSession = await api.getSession(sessionId, content.id);

      if (!existingSession) {
        await api.createSession({
          session_id: sessionId,
          content_id: content.id,
          ads_required: content.requiredAds
        });
      }

      await api.incrementViews(content.id);

      navigate(`/unlock/${content.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }

  function handleCloseClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }

  function handleCancelClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleBackdropClick}
      />
      
      <div className="relative w-full max-w-md glass-intense rounded-xl sm:rounded-2xl overflow-hidden animate-scale-in neon-border max-h-[90vh] overflow-y-auto">
        <button 
          onClick={handleCloseClick}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </button>

        <div className="relative aspect-video overflow-hidden">
          {content.thumbnailUrl ? (
            <img 
              src={content.thumbnailUrl} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>

        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 glass rounded-full">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-primary">Content Locked</span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2">{content.title}</h2>
            
            {content.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{content.description}</p>
            )}
          </div>

          <div className="p-3 sm:p-4 glass rounded-xl text-center space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">You must watch</p>
            <p className="text-2xl sm:text-3xl font-bold text-gradient-neon">{content.requiredAds} Ads</p>
            <p className="text-xs sm:text-sm text-muted-foreground">to unlock this content</p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleCancelClick}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border text-sm sm:text-base text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTask}
              className="flex-1 btn-neon flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
