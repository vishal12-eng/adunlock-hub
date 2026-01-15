import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { RelatedContent } from '@/components/RelatedContent';
import { SocialShare } from '@/components/SocialShare';
import { InterstitialAd } from '@/components/InterstitialAd';
import { SEOHead } from '@/components/SEOHead';
import { RewardConfirmDialog } from '@/components/RewardConfirmDialog';
import { RewardCelebration } from '@/components/RewardCelebration';
import { AdsDiscountSlider } from '@/components/shop/AdsDiscountSlider';
import { MinimizableNativeAd } from '@/components/ads/MinimizableNativeAd';
import { InteractiveRating } from '@/components/RatingStars';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useSEO, generateContentSchema, generateBreadcrumbSchema } from '@/hooks/useSEO';
import { useABTest } from '@/hooks/useABTest';
import { useReferral } from '@/hooks/useReferral';
import { useRewardSpending } from '@/hooks/useRewardSpending';
import { useRatings, getDisplayRating } from '@/hooks/useRatings';
import { api, Content, UserSession, ApiError } from '@/lib/api';
import { getSessionId } from '@/lib/session';
import { 
  CheckCircle, 
  Lock, 
  ExternalLink, 
  Loader2,
  ArrowLeft,
  Download,
  Play,
  Clock,
  Coins,
  CreditCard,
  Zap,
  Gift,
  Sparkles,
  TrendingDown,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

const MIN_AD_TIME_SECONDS = 12;

export default function UnlockPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<Content | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [smartlinkAvailable, setSmartlinkAvailable] = useState(true);
  
  const [adToken, setAdToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { showAd, closeAd, incrementPageView } = useInterstitialAd();
  
  // Referral rewards hook
  const { 
    coins, 
    bonusUnlocks, 
    adsReduction,
    config: rewardConfig,
    recordUnlock,
    calculateEffectiveAds
  } = useReferral();

  // Reward spending with confirmation dialogs
  const {
    pendingAction,
    isConfirmOpen,
    isProcessing,
    showCelebration,
    celebrationMessage,
    requestUnlockCard,
    requestFullUnlock,
    requestSkipAd,
    confirmAction,
    cancelAction,
    dismissCelebration,
  } = useRewardSpending();

  // Ratings system
  const { userRating, rateContent, hasRated } = useRatings(contentId);

  // A/B Testing
  const ctaTest = useABTest('CTA_BUTTON_COLOR');

  // Dynamic SEO based on content
  useSEO({
    title: content?.title,
    description: content?.description || `Unlock "${content?.title}" by watching a few ads. Fast, secure download.`,
    url: `/unlock/${contentId}`,
    type: 'article',
    image: content?.thumbnail_url || undefined,
    keywords: ['unlock', 'download', content?.title || ''].filter(Boolean),
  });

  // Generate structured data for content
  const contentSchema = content ? generateContentSchema({
    id: content.id,
    title: content.title,
    description: content.description,
    thumbnailUrl: content.thumbnail_url,
    views: content.views,
    unlocks: content.unlocks,
  }) : null;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: content?.title || 'Content', url: `/unlock/${contentId}` },
  ]);

  // Track A/B test impression
  useEffect(() => {
    if (content) {
      ctaTest.trackImpression();
    }
  }, [content]);

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
    } catch (error) {
      console.error('Failed to load content:', error);
      navigate('/');
      return;
    }

    setLoading(false);
  }, [contentId, navigate]);

  useEffect(() => {
    fetchData();
    incrementPageView();
  }, [fetchData, incrementPageView]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  async function handleWatchAd(e: React.MouseEvent) {
    e.preventDefault();
    
    if (!session || !contentId) {
      toast.error('Session not ready');
      return;
    }

    const sessionId = getSessionId();

    try {
      const response = await api.startAd({
        session_id: sessionId,
        content_id: contentId,
        user_session_id: session.id
      });

      if (!response.smartlink_url) {
        toast.error('Ad service not configured');
        return;
      }

      setAdToken(response.token);
      setCountdown(response.min_time_seconds);

      window.open(response.smartlink_url, '_blank', 'noopener,noreferrer');

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'cooldown') {
        const waitTime = error.wait_seconds || 15;
        setCooldownRemaining(waitTime);
        cooldownRef.current = setInterval(() => {
          setCooldownRemaining(prev => {
            if (prev <= 1) {
              if (cooldownRef.current) clearInterval(cooldownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        toast.error(error.message);
      } else if (error instanceof ApiError && error.code === 'no_smartlink') {
        toast.error('Ad service not configured. Please contact admin.');
        setSmartlinkAvailable(false);
      } else {
        const err = error as Error;
        toast.error(err.message || 'Failed to start ad');
      }
    }
  }

  async function handleCompleteAd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!adToken || completing) return;

    setCompleting(true);

    try {
      const response = await api.completeAd(adToken);
      
      setSession(response.session);
      setAdToken(null);
      setCountdown(0);

      if (response.completed) {
        toast.success('Content unlocked!');
      } else {
        toast.success(`Ad watched! ${response.session.ads_required - response.session.ads_watched} more to go.`);
      }

    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      if (err.code === 'token_expired') {
        setAdToken(null);
        setCountdown(0);
      }
      toast.error(err.message || 'Failed to complete ad');
    }

    setCompleting(false);
  }

  function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    
    if (!content) return;

    if (content.redirect_url) {
      window.open(content.redirect_url, '_blank', 'noopener,noreferrer');
    } else if (content.file_url) {
      window.open(content.file_url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleBackClick(e: React.MouseEvent) {
    e.preventDefault();
    navigate('/');
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
  const isWaitingForAd = adToken !== null;
  const canComplete = isWaitingForAd && countdown === 0;

  return (
    <div className="min-h-screen">
      <SEOHead jsonLd={[contentSchema, breadcrumbSchema].filter(Boolean)} />
      <InterstitialAd isOpen={showAd} onClose={closeAd} />
      <Header />
      
      <main className="pt-20 sm:pt-28 pb-12 sm:pb-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Top Minimizable Native Ad */}
          <div className="mb-4">
            <MinimizableNativeAd position="top" className="rounded-lg overflow-hidden" />
          </div>

          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-8"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="glass-intense rounded-xl sm:rounded-2xl overflow-hidden neon-border">
            <div className="relative aspect-video overflow-hidden">
              {content.thumbnail_url ? (
                <img 
                  src={content.thumbnail_url} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  <Lock className="w-14 h-14 sm:w-20 sm:h-20 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              
              <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                isCompleted ? 'bg-green-500/20 border border-green-500/50' : 'glass'
              }`}>
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm font-medium text-green-400">Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-primary">Locked</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2" data-testid="text-content-title">{content.title}</h1>
                  {content.description && (
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">{content.description}</p>
                  )}
                  
                  {/* Rating and Downloads Stats */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{getDisplayRating(content.id, content.views, content.unlocks).rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{content.unlocks.toLocaleString()} downloads</span>
                    </div>
                  </div>
                </div>
                <SocialShare title={content.title} contentId={content.id} />
              </div>

              {/* Rating Section - Allow users to rate */}
              <div className="glass rounded-lg p-3 sm:p-4">
                <InteractiveRating
                  contentId={content.id}
                  currentRating={userRating}
                  onRate={(id, rating) => {
                    rateContent(id, rating);
                    toast.success(`Rated ${rating} stars!`);
                  }}
                  size="md"
                />
                {hasRated(content.id) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Thanks for rating! Your rating helps others discover great apps.
                  </p>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
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

                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                  This content requires <span className="font-semibold text-primary">{session.ads_required} ads</span> to unlock
                </p>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">{session.ads_required}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Required</p>
                  </div>
                  <div className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{session.ads_watched}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Watched</p>
                  </div>
                  <div className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-accent">{session.ads_required - session.ads_watched}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Rewards Options - Show if user has rewards */}
              {!isCompleted && (bonusUnlocks > 0 || coins > 0) && (
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-foreground">Use Your Rewards</span>
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-wiggle" />
                  </div>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    {/* Use Unlock Card */}
                    {bonusUnlocks > 0 && (
                      <button
                        onClick={() => {
                          requestUnlockCard(() => {
                            recordUnlock();
                            setSession(prev => prev ? { ...prev, completed: true, ads_watched: prev.ads_required } : null);
                          });
                        }}
                        className="group flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-lg bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50 transition-all text-xs sm:text-sm font-medium text-green-400"
                      >
                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-card-slide" />
                        <span className="truncate">Use Unlock Card ({bonusUnlocks})</span>
                      </button>
                    )}
                    
                    {/* Use Coins for Full Unlock */}
                    {coins >= rewardConfig.coinsForFullUnlock && (
                      <button
                        onClick={() => {
                          requestFullUnlock(() => {
                            recordUnlock();
                            setSession(prev => prev ? { ...prev, completed: true, ads_watched: prev.ads_required } : null);
                          });
                        }}
                        className="group flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 hover:border-yellow-500/50 transition-all text-xs sm:text-sm font-medium text-yellow-400"
                      >
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-coin-flip" />
                        <span className="truncate">Full Unlock ({rewardConfig.coinsForFullUnlock} coins)</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Skip Single Ad with Coins */}
                  {!isWaitingForAd && coins >= rewardConfig.coinsPerAdSkip && session.ads_watched < session.ads_required && (
                    <button
                      onClick={() => {
                        requestSkipAd(() => {
                          const newAdsWatched = session.ads_watched + 1;
                          const isNowCompleted = newAdsWatched >= session.ads_required;
                          setSession(prev => prev ? { 
                            ...prev, 
                            ads_watched: newAdsWatched,
                            completed: isNowCompleted 
                          } : null);
                          if (isNowCompleted) {
                            recordUnlock();
                          }
                        });
                      }}
                      className="group w-full flex items-center justify-center gap-1.5 sm:gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all text-[10px] sm:text-xs font-medium text-primary"
                    >
                      <Zap className="w-3 h-3 group-hover:animate-wiggle" />
                      Skip 1 Ad ({rewardConfig.coinsPerAdSkip} coins) - You have {coins} coins
                    </button>
                  )}
                  
                  {/* Ads Reduction Info */}
                  {adsReduction > 0 && (
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                      You have <span className="text-accent font-semibold">{adsReduction}% ads reduction</span> from referrals
                    </p>
                  )}
                </div>
              )}

              {/* Ads Discount Slider - Show before watching ads */}
              {!isCompleted && !isWaitingForAd && session.ads_watched === 0 && session.ads_required > 1 && (
                <AdsDiscountSlider
                  contentId={content.id}
                  contentTitle={content.title}
                  originalAds={session.ads_required}
                  onDiscountApplied={(newAdsCount, coinsSpent) => {
                    setSession(prev => prev ? { 
                      ...prev, 
                      ads_required: newAdsCount 
                    } : null);
                    toast.success(`Reduced to ${newAdsCount} ads!`, {
                      description: `Used ${coinsSpent} coins`,
                    });
                  }}
                />
              )}

              <div className="space-y-2 sm:space-y-3">
                {isCompleted ? (
                  <button
                    onClick={handleDownload}
                    className="w-full btn-neon flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base animate-unlock"
                    data-testid="button-download"
                  >
                    {content.redirect_url ? (
                      <>
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        Proceed to Content
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        Download Now
                      </>
                    )}
                  </button>
                ) : isWaitingForAd ? (
                  <div className="space-y-2 sm:space-y-3">
                    {countdown > 0 && (
                      <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
                          <span className="text-base sm:text-lg font-semibold text-foreground">Watching Ad...</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">{countdown}s</div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Please wait for the timer to complete
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleCompleteAd}
                      disabled={!canComplete || completing}
                      className="w-full btn-neon flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-continue"
                    >
                      {completing ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : canComplete ? (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                          Wait {countdown}s
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleWatchAd}
                    disabled={cooldownRemaining > 0}
                    className="w-full btn-neon flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-watch-ad"
                  >
                    {cooldownRemaining > 0 ? (
                      <>
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        Wait {cooldownRemaining}s
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                        Watch Ad ({session.ads_required - session.ads_watched} remaining)
                      </>
                    )}
                  </button>
                )}

                {!smartlinkAvailable && !isCompleted && (
                  <p className="text-center text-xs sm:text-sm text-destructive">
                    Ad service not configured. Please contact admin.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Native Ad */}
          <div className="mt-6">
            <MinimizableNativeAd position="inline" className="rounded-lg overflow-hidden" />
          </div>

          {/* Related Content */}
          <RelatedContent currentContentId={content.id} />
        </div>
      </main>

      {/* Reward Confirmation Dialog */}
      <RewardConfirmDialog
        open={isConfirmOpen}
        onOpenChange={(open) => !open && cancelAction()}
        onConfirm={confirmAction}
        type={pendingAction?.type ?? 'unlock-card'}
        cost={pendingAction?.cost ?? 0}
        currentBalance={pendingAction?.balance ?? 0}
        isLoading={isProcessing}
      />

      {/* Celebration Animation */}
      <RewardCelebration
        show={showCelebration}
        onComplete={dismissCelebration}
        message={celebrationMessage}
      />
    </div>
  );
}
