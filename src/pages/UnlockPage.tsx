import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/session';
import { 
  CheckCircle, 
  Lock, 
  ExternalLink, 
  Loader2,
  ArrowLeft,
  Download,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionData {
  id: string;
  session_id: string;
  content_id: string;
  ads_required: number;
  ads_watched: number;
  completed: boolean;
}

interface ContentData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  redirect_url: string | null;
  required_ads: number;
}

export default function UnlockPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<ContentData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState(false);
  const [smartlink, setSmartlink] = useState('');

  const fetchData = useCallback(async () => {
    if (!contentId) return;

    const sessionId = getSessionId();

    // Fetch content
    const { data: contentData } = await supabase
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .eq('status', 'active')
      .maybeSingle();

    if (!contentData) {
      navigate('/');
      return;
    }

    setContent(contentData);

    // Fetch or create session
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('content_id', contentId)
      .maybeSingle();

    if (sessionData) {
      setSession(sessionData);
    } else {
      // Create new session
      const { data: newSession } = await supabase
        .from('user_sessions')
        .insert({
          session_id: sessionId,
          content_id: contentId,
          ads_required: contentData.required_ads,
          ads_watched: 0,
          completed: false
        })
        .select()
        .single();

      setSession(newSession);
    }

    // Fetch smartlink
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'adsterra_smartlink')
      .maybeSingle();

    if (settings?.value) {
      setSmartlink(settings.value);
    }

    setLoading(false);
  }, [contentId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleWatchAd() {
    if (!session || !smartlink) {
      toast.error('Ad service not configured');
      return;
    }

    setWatchingAd(true);

    // Open ad in new tab
    window.open(smartlink, '_blank');

    // Simulate ad watch (in production, this would be verified server-side)
    setTimeout(async () => {
      const newAdsWatched = session.ads_watched + 1;
      const isCompleted = newAdsWatched >= session.ads_required;

      const { data: updatedSession } = await supabase
        .from('user_sessions')
        .update({
          ads_watched: newAdsWatched,
          completed: isCompleted
        })
        .eq('id', session.id)
        .select()
        .single();

      if (updatedSession) {
        setSession(updatedSession);

        if (isCompleted) {
          // Increment unlock count
          await supabase.rpc('increment_content_unlocks', { content_uuid: contentId });
          toast.success('Content unlocked! 🎉');
        } else {
          toast.success(`Ad watched! ${session.ads_required - newAdsWatched} more to go.`);
        }
      }

      setWatchingAd(false);
    }, 3000);
  }

  function handleDownload() {
    if (!content) return;

    if (content.redirect_url) {
      window.open(content.redirect_url, '_blank');
    } else if (content.file_url) {
      window.open(content.file_url, '_blank');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!content || !session) {
    return null;
  }

  const progress = (session.ads_watched / session.ads_required) * 100;
  const isCompleted = session.completed;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Content Card */}
          <div className="glass-intense rounded-2xl overflow-hidden neon-border">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              {content.thumbnail_url ? (
                <img 
                  src={content.thumbnail_url} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  <Lock className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              
              {/* Status badge */}
              <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isCompleted ? 'bg-green-500/20 border border-green-500/50' : 'glass'
              }`}>
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Locked</span>
                  </>
                )}
              </div>
            </div>

            {/* Content info */}
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{content.title}</h1>
                {content.description && (
                  <p className="text-muted-foreground">{content.description}</p>
                )}
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {session.ads_watched} / {session.ads_required} Ads Watched
                  </span>
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{session.ads_required}</p>
                    <p className="text-xs text-muted-foreground">Required</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{session.ads_watched}</p>
                    <p className="text-xs text-muted-foreground">Watched</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-accent">{session.ads_required - session.ads_watched}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isCompleted ? (
                  <button
                    onClick={handleDownload}
                    className="w-full btn-neon flex items-center justify-center gap-2 py-4 animate-unlock"
                  >
                    {content.redirect_url ? (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Proceed to Content
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Download Now
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleWatchAd}
                    disabled={watchingAd || !smartlink}
                    className="w-full btn-neon flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {watchingAd ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Watching Ad...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Watch Ad ({session.ads_required - session.ads_watched} remaining)
                      </>
                    )}
                  </button>
                )}

                {!smartlink && !isCompleted && (
                  <p className="text-center text-sm text-destructive">
                    Ad service not configured. Please contact admin.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
