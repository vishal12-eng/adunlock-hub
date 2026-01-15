import { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { ContentCard } from '@/components/ContentCard';
import { UnlockModal } from '@/components/UnlockModal';
import { AdBanner } from '@/components/AdBanner';
import { AdvertisementBanner } from '@/components/AdvertisementBanner';
import { FeaturedAppsCarousel } from '@/components/FeaturedAppsCarousel';
import { RecentlyAddedSection } from '@/components/RecentlyAddedSection';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { InterstitialAd } from '@/components/InterstitialAd';
import { ContentFilters, SortOption } from '@/components/ContentFilters';
import { TimedOfferBanner } from '@/components/TimedOfferBanner';
import { ProgressTracker } from '@/components/ProgressTracker';
import { VideoAdModal } from '@/components/VideoAdModal';
import { SEOHead } from '@/components/SEOHead';
import { CategoryTags, detectCategory, CATEGORIES } from '@/components/CategoryTags';
import { ReferralWidgetCompact } from '@/components/referral/ReferralWidgets';
import { processIncomingReferral } from '@/lib/referral';
import { DailyRewardsWidget } from '@/components/DailyRewards';
import { EmailCollector } from '@/components/EmailCollector';
import { FooterNewsletter } from '@/components/NewsletterSubscribe';
import { NativeAdUnit } from '@/components/ads/NativeAdUnit';
import { StickyBottomAd } from '@/components/ads/StickyBottomAd';
import { FloatingAdButton } from '@/components/ads/FloatingAdButton';
import { InArticleAd, PromoStrip } from '@/components/ads/InArticleAd';
import { ContentDividerAd } from '@/components/ads/ContentDividerAd';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useSEO, generateFAQSchema } from '@/hooks/useSEO';
import { useABTest } from '@/hooks/useABTest';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { api, Content } from '@/lib/api';
import { Zap, TrendingUp, Shield, Search, X, Loader2 } from 'lucide-react';

export default function Index() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filterByAds, setFilterByAds] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showVideoAd, setShowVideoAd] = useState(false);
  const { showAd, closeAd, incrementPageView } = useInterstitialAd();
  const { nativeAds } = useAdsConfig();
  const contentGridRef = useRef<HTMLDivElement>(null);

  // Handle category change with smooth scroll
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Smooth scroll to content grid
    setTimeout(() => {
      contentGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Check for referral code on page load
  useEffect(() => {
    processIncomingReferral();
  }, []);

  // SEO optimization
  useSEO({
    title: undefined, // Uses default homepage title
    description: 'Unlock premium content by watching a few ads. Fast, secure, and no sign-up required. Download exclusive files, APKs, and more.',
    url: '/',
    keywords: ['content locker', 'premium downloads', 'free downloads', 'APK downloads', 'unlock content'],
  });

  // A/B Testing for CTA and Featured section
  const ctaTest = useABTest('CTA_BUTTON_TEXT');
  const featuredTest = useABTest('FEATURED_SECTION');
  const urgencyTest = useABTest('URGENCY_DISPLAY');

  // Track impressions
  useEffect(() => {
    ctaTest.trackImpression();
    featuredTest.trackImpression();
    urgencyTest.trackImpression();
  }, []);

  // FAQ Schema for SEO
  const faqSchema = generateFAQSchema([
    {
      question: 'How does ADNEXUS work?',
      answer: 'Watch a few short ads to unlock premium content instantly. No sign-up required.',
    },
    {
      question: 'Is it free to use?',
      answer: 'Yes! ADNEXUS is completely free. You just watch ads to unlock content.',
    },
    {
      question: 'How many ads do I need to watch?',
      answer: 'The number of ads varies by content, typically 1-3 ads per unlock.',
    },
  ]);

  useEffect(() => {
    fetchContents();
  }, []);

  // Show video ad on first visit (once per session)
  useEffect(() => {
    const hasSeenVideoAd = sessionStorage.getItem('seen_video_ad');
    if (!hasSeenVideoAd && contents.length > 0) {
      const timer = setTimeout(() => {
        setShowVideoAd(true);
        sessionStorage.setItem('seen_video_ad', 'true');
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [contents]);

  async function fetchContents() {
    try {
      const data = await api.getContents();
      setContents(data);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    }
    setLoading(false);
  }

  // Calculate category counts for badges
  const contentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contents.forEach(content => {
      const category = detectCategory(content.title, content.description);
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [contents]);

  const filteredAndSortedContents = useMemo(() => {
    let result = [...contents];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(content => {
        const category = detectCategory(content.title, content.description);
        return category === selectedCategory;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(content => 
        content.title.toLowerCase().includes(query) ||
        (content.description && content.description.toLowerCase().includes(query))
      );
    }

    // Apply ad count filter
    if (filterByAds !== null) {
      if (filterByAds === 3) {
        result = result.filter(content => content.required_ads >= 3);
      } else {
        result = result.filter(content => content.required_ads === filterByAds);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'unlocks':
        result.sort((a, b) => b.unlocks - a.unlocks);
        break;
      case 'ads-low':
        result.sort((a, b) => a.required_ads - b.required_ads);
        break;
      case 'ads-high':
        result.sort((a, b) => b.required_ads - a.required_ads);
        break;
    }

    return result;
  }, [contents, searchQuery, sortBy, filterByAds, selectedCategory]);

  // Infinite scroll for content grid
  const { 
    displayedItems: paginatedContents, 
    hasMore, 
    isLoadingMore, 
    loadMoreRef 
  } = useInfiniteScroll(filteredAndSortedContents, {
    initialPageSize: 12,
    pageSize: 8,
    threshold: 300
  });

  function handleContentClick(content: Content) {
    incrementPageView();
    setSelectedContent(content);
  }

  function renderContentWithAds() {
    const items: JSX.Element[] = [];
    const adFrequency = nativeAds.enabled && nativeAds.frequency > 0 ? nativeAds.frequency : 8;
    const inArticleStyles: Array<'card' | 'banner' | 'featured' | 'recommendation'> = ['card', 'banner', 'featured', 'recommendation'];
    let styleIndex = 0;
    
    paginatedContents.forEach((content, index) => {
      items.push(
        <ContentCard
          key={content.id}
          id={content.id}
          title={content.title}
          description={content.description}
          thumbnailUrl={content.thumbnail_url}
          requiredAds={content.required_ads}
          views={content.views}
          unlocks={content.unlocks}
          createdAt={content.created_at}
          onClick={() => handleContentClick(content)}
          index={index}
        />
      );

      // Insert native ad based on admin-configured frequency
      if ((index + 1) % adFrequency === 0 && index < paginatedContents.length - 1) {
        const currentStyle = inArticleStyles[styleIndex % inArticleStyles.length];
        styleIndex++;
        
        if (nativeAds.enabled) {
          items.push(
            <div key={`native-ad-${index}`} className="col-span-full">
              <NativeAdUnit className="my-2" />
            </div>
          );
        } else {
          // Use varied in-article ad styles for better engagement
          items.push(
            <div key={`ad-${index}`} className="col-span-full">
              <InArticleAd style={currentStyle} className="my-3" />
            </div>
          );
        }
      }
    });

    return items;
  }

  return (
    <div className="min-h-screen main-content-with-sticky-ad">
      <SEOHead jsonLd={faqSchema} />
      <ExitIntentPopup />
      <InterstitialAd isOpen={showAd} onClose={closeAd} />
      <VideoAdModal isOpen={showVideoAd} onClose={() => setShowVideoAd(false)} />
      <EmailCollector trigger="auto" />
      
      <Header />
      
      {/* Floating Ad Button - appears on scroll - positioned above sticky ad */}
      <FloatingAdButton position="right" showAfterScroll={500} />
      
      {/* Sticky Bottom Ad - lower z-index to not overlap content */}
      <StickyBottomAd autoHideAfter={60} />
      
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-16 px-3 sm:px-4">
        <div className="container mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full opacity-0 animate-fade-in hover-glow">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Premium Content Awaits</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold opacity-0 animate-fade-in stagger-2">
            <span className="text-foreground">Unlock </span>
            <span className="text-gradient-neon">Premium Content</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in stagger-3 px-2">
            Watch a few ads to get instant access to exclusive downloads, files, and premium resources.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full opacity-0 animate-fade-in stagger-4 hover-lift">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm text-foreground">Fast Unlocks</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full opacity-0 animate-fade-in stagger-5 hover-lift">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm text-foreground">Secure Downloads</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full opacity-0 animate-fade-in stagger-6 hover-lift">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm text-foreground">No Sign-up</span>
            </div>
          </div>
        </div>
      </section>

      {/* Timed Offer Banner */}
      <section className="px-3 sm:px-4 pb-4 sm:pb-6">
        <div className="container mx-auto max-w-4xl">
          <TimedOfferBanner />
        </div>
      </section>

      <section className="px-3 sm:px-4 pb-6 sm:pb-8">
        <div className="container mx-auto">
          <AdBanner className="max-w-4xl mx-auto h-20 sm:h-28" />
        </div>
      </section>

      <section className="px-3 sm:px-4 pb-4 sm:pb-6">
        <div className="container mx-auto">
          <AdvertisementBanner className="max-w-4xl mx-auto h-24 sm:h-32 md:h-40" />
        </div>
      </section>

      {/* Progress Tracker & Rewards */}
      <section className="px-3 sm:px-4 pb-4 sm:pb-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <ProgressTracker />
            <DailyRewardsWidget variant="compact" />
            <ReferralWidgetCompact />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-3 sm:px-4 pb-4 sm:pb-6">
        <div className="container mx-auto">
          <CategoryTags 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            contentCounts={contentCounts}
          />
        </div>
      </section>

      {/* Trending Apps Carousel */}
      {contents.length > 0 && (
        <FeaturedAppsCarousel contents={contents} onContentClick={handleContentClick} />
      )}

      {/* In-Article Promo Strip - between sections */}
      <section className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="container mx-auto max-w-4xl">
          <PromoStrip />
        </div>
      </section>

      {/* Recently Added Section */}
      {contents.length > 0 && (
        <RecentlyAddedSection contents={contents} onContentClick={handleContentClick} />
      )}

      {/* Content Divider Ad */}
      <section className="px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <ContentDividerAd variant="gradient" />
        </div>
      </section>

      <section ref={contentGridRef} className="px-3 sm:px-4 pb-12 sm:pb-20 scroll-mt-20">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                  Available Content
                </h2>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {filteredAndSortedContents.length} of {contents.length} items
                </span>
              </div>
              
              <div className="relative w-full sm:w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content..."
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl bg-input border border-border text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-active"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters and Sorting */}
            <ContentFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterByAds={filterByAds}
              onFilterChange={setFilterByAds}
            />
          </div>

          {loading ? (
            <div className="app-grid">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="app-card-skeleton"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="app-icon-skeleton skeleton-shimmer" />
                  <div className="app-info-skeleton">
                    <div className="h-3.5 skeleton-shimmer rounded w-full" />
                    <div className="h-3 skeleton-shimmer rounded w-2/3 mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedContents.length === 0 ? (
            <div className="text-center py-12 sm:py-20 glass rounded-xl sm:rounded-2xl">
              {searchQuery || filterByAds !== null ? (
                <>
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Results Found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Try a different search term or filter</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterByAds(null);
                    }}
                    className="mt-3 sm:mt-4 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Content Available</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Check back later for new content!</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="app-grid">
                {renderContentWithAds()}
              </div>
              
              {/* Infinite Scroll Loader */}
              {hasMore && (
                <div 
                  ref={loadMoreRef} 
                  className="flex items-center justify-center py-8 mt-4"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">Loading more apps...</span>
                    </div>
                  ) : (
                    <div className="h-8" /> 
                  )}
                </div>
              )}
              
              {/* End of List Indicator */}
              {!hasMore && paginatedContents.length > 0 && (
                <div className="text-center py-6 mt-4 text-muted-foreground text-sm">
                  <p>You've seen all {filteredAndSortedContents.length} apps 🎉</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <FooterNewsletter />
          <p className="text-sm text-muted-foreground text-center mt-8">
            © 2024 ADNEXUS. Watch Ads. Unlock Content.
          </p>
        </div>
      </footer>

      {selectedContent && (
        <UnlockModal
          isOpen={!!selectedContent}
          onClose={() => setSelectedContent(null)}
          content={{
            id: selectedContent.id,
            title: selectedContent.title,
            description: selectedContent.description,
            thumbnailUrl: selectedContent.thumbnail_url,
            requiredAds: selectedContent.required_ads
          }}
        />
      )}
    </div>
  );
}
