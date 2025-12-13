import { X, Lock, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

  async function handleStartTask() {
    const sessionId = getSessionId();

    // Create or get existing session
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('content_id', content.id)
      .maybeSingle();

    if (!existingSession) {
      await supabase.from('user_sessions').insert({
        session_id: sessionId,
        content_id: content.id,
        ads_required: content.requiredAds,
        ads_watched: 0,
        completed: false
      });
    }

    // Increment view count
    await supabase.rpc('increment_content_views', { content_uuid: content.id });

    // Navigate to task page
    navigate(`/unlock/${content.id}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-intense rounded-2xl overflow-hidden animate-scale-in neon-border">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {content.thumbnailUrl ? (
            <img 
              src={content.thumbnailUrl} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <Lock className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full">
              <Lock className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Content Locked</span>
            </div>
            
            <h2 className="text-xl font-bold text-foreground">{content.title}</h2>
            
            {content.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{content.description}</p>
            )}
          </div>

          <div className="p-4 glass rounded-xl text-center space-y-1">
            <p className="text-sm text-muted-foreground">You must watch</p>
            <p className="text-3xl font-bold text-gradient-neon">{content.requiredAds} Ads</p>
            <p className="text-sm text-muted-foreground">to unlock this content</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTask}
              className="flex-1 btn-neon flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Start Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
