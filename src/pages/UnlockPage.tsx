import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { api, Content, UserSession } from '@/lib/api';
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

export default function UnlockPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<Content | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState(false);
  const [smartlink, setSmartlink] = useState('');

  const fetchData = useCallback(async () => {
    if (!contentId) return;

    const sessionId = getSessionId();

    try {
      const contentData = await api.getContent(contentId);
      if (!contentData || contentData.status !== 'active') {
        navigate('/');
        return;
      }

      setContent(contentData);

      let sessionData = await api.getSession(sessionId, contentId);

      if (!sessionData) {
        sessionData = await api.createSession({
          session_id: sessionId,
          content_id: contentId,
          ads_required: contentData.required_ads,
          ads_watched: 0,
          completed: false
        });
      }

      setSession(sessionData);

      const settings = await api.getSettings();
      if (settings.adsterra_smartlink) {
        setSmartlink(settings.adsterra_smartlink);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      navigate('/');
      return;
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

    window.open(smartlink, '_blank');

    setTimeout(async () => {
      const newAdsWatched = session.ads_watched + 1;
      const isCompleted = newAdsWatched >= session.ads_required;

      try {
        const updatedSession = await api.updateSession(session.id, {
          ads_watched: newAdsWatched,
          completed: isCompleted
        });

        if (updatedSession) {
          setSession(updatedSession);

          if (isCompleted) {
            await api.incrementUnlocks(contentId!);
            toast.success('Content unlocked!');
          } else {
            toast.success(`Ad watched! ${session.ads_required - newAdsWatched} more to go.`);
          }
        }
      } catch (error) {
        toast.error('Failed to update progress');
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
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="glass-intense rounded-2xl overflow-hidden neon-border">
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

            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-content-title">{content.title}</h1>
                {content.description && (
                  <p className="text-muted-foreground">{content.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground" data-testid="text-progress">
                    {session.ads_watched} / {session.ads_required} Ads Watched
                  </span>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

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

              <div className="space-y-3">
                {isCompleted ? (
                  <button
                    onClick={handleDownload}
                    className="w-full btn-neon flex items-center justify-center gap-2 py-4 animate-unlock"
                    data-testid="button-download"
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
                    data-testid="button-watch-ad"
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
