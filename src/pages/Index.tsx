import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ContentCard } from '@/components/ContentCard';
import { UnlockModal } from '@/components/UnlockModal';
import { AdBanner } from '@/components/AdBanner';
import { AdvertisementBanner } from '@/components/AdvertisementBanner';
import { api, Content } from '@/lib/api';
import { Zap, TrendingUp, Shield, Search, X } from 'lucide-react';

export default function Index() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  async function fetchContents() {
    try {
      const data = await api.getContents();
      setContents(data);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    }
    setLoading(false);
  }

  const filteredContents = useMemo(() => {
    if (!searchQuery.trim()) return contents;
    const query = searchQuery.toLowerCase().trim();
    return contents.filter(content => 
      content.title.toLowerCase().includes(query) ||
      (content.description && content.description.toLowerCase().includes(query))
    );
  }, [contents, searchQuery]);

  function handleContentClick(content: Content) {
    setSelectedContent(content);
  }

  function renderContentWithAds() {
    const items: JSX.Element[] = [];
    
    filteredContents.forEach((content, index) => {
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

      if ((index + 1) % 4 === 0 && index < filteredContents.length - 1) {
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
      <Header />
      
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Content Awaits</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Unlock </span>
            <span className="text-gradient-neon">Premium Content</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Watch a few ads to get instant access to exclusive downloads, files, and premium resources.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Fast Unlocks</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Secure Downloads</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">No Sign-up Required</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <AdBanner className="max-w-4xl mx-auto h-28" />
        </div>
      </section>

      <section className="px-4 pb-6">
        <div className="container mx-auto">
          <AdvertisementBanner className="max-w-4xl mx-auto h-32 md:h-40" />
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <h2 className="text-2xl font-bold text-foreground">
                Available Content
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredContents.length} of {contents.length} items
              </span>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">Try a different search term</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Content Available</h3>
                  <p className="text-muted-foreground">Check back later for new content!</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderContentWithAds()}
            </div>
          )}
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
