import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ContentCard } from '@/components/ContentCard';
import { UnlockModal } from '@/components/UnlockModal';
import { AdBanner } from '@/components/AdBanner';
import { AdvertisementBanner } from '@/components/AdvertisementBanner';
import { FeaturedContent } from '@/components/FeaturedContent';
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
import { EmailCollector, InlineEmailCollector } from '@/components/EmailCollector';
import { PushNotificationPrompt } from '@/components/PushNotifications';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useSEO, generateFAQSchema } from '@/hooks/useSEO';
import { useABTest } from '@/hooks/useABTest';
import { api, Content } from '@/lib/api';
import { Zap, TrendingUp, Shield, Search, X } from 'lucide-react';

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

  function handleContentClick(content: Content) {
    incrementPageView();
    setSelectedContent(content);
  }

  function renderContentWithAds() {
    const items: JSX.Element[] = [];
    
    filteredAndSortedContents.forEach((content, index) => {
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
          onClick={() => handleContentClick(content)}
        />
      );

      // Insert ad banner every 4 items
      if ((index + 1) % 4 === 0 && index < filteredAndSortedContents.length - 1) {
        items.push(
          <div key={`ad-${index}`} className="col-span-full">
            <AdBanner className="h-32" />
          </div>
        );
      }
    });

    return items;
  }

  return (
    <div className="min-h-screen">
      <SEOHead jsonLd={faqSchema} />
      <ExitIntentPopup />
      <InterstitialAd isOpen={showAd} onClose={closeAd} />
      <VideoAdModal isOpen={showVideoAd} onClose={() => setShowVideoAd(false)} />
      <EmailCollector trigger="auto" />
      <PushNotificationPrompt />
      <Header />
      
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-16 px-3 sm:px-4">
        <div className="container mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full animate-fade-in">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Premium Content Awaits</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Unlock </span>
            <span className="text-gradient-neon">Premium Content</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
            Watch a few ads to get instant access to exclusive downloads, files, and premium resources.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 pt-4 sm:pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm text-foreground">Fast Unlocks</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm text-foreground">Secure Downloads</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full">
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
            onCategoryChange={setSelectedCategory}
            contentCounts={contentCounts}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-6">
        <div className="container mx-auto">
          <CategoryTags 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            contentCounts={contentCounts}
          />
        </div>
      </section>

      {/* Featured Content Section */}
      {contents.length > 0 && (
        <FeaturedContent contents={contents} onContentClick={handleContentClick} />
      )}

      <section className="px-3 sm:px-4 pb-12 sm:pb-20">
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
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content..."
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl bg-input border border-border text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass rounded-xl sm:rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="h-4 sm:h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {renderContentWithAds()}
            </div>
          )}
        </div>
      </section>

      {/* Email Collection Section */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-md">
          <InlineEmailCollector />
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
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
