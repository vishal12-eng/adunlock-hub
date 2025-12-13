import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ContentCard } from '@/components/ContentCard';
import { UnlockModal } from '@/components/UnlockModal';
import { AdBanner } from '@/components/AdBanner';
import { supabase } from '@/integrations/supabase/client';
import { Zap, TrendingUp, Shield } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  required_ads: number;
  views: number;
  unlocks: number;
}

export default function Index() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  async function fetchContents() {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContents(data);
    }
    setLoading(false);
  }

  function handleContentClick(content: Content) {
    setSelectedContent(content);
  }

  // Insert ad banners between content
  function renderContentWithAds() {
    const items: JSX.Element[] = [];
    
    contents.forEach((content, index) => {
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

      // Insert ad every 4 items
      if ((index + 1) % 4 === 0 && index < contents.length - 1) {
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
      
      {/* Hero Section */}
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

          {/* Features */}
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

      {/* Ad Banner */}
      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <AdBanner className="max-w-4xl mx-auto h-28" />
        </div>
      </section>

      {/* Content Grid */}
      <section className="px-4 pb-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Available Content
            </h2>
            <span className="text-sm text-muted-foreground">
              {contents.length} items
            </span>
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
          ) : contents.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Content Available</h3>
              <p className="text-muted-foreground">Check back later for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderContentWithAds()}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 ADNEXUS. Watch Ads. Unlock Content.
          </p>
        </div>
      </footer>

      {/* Unlock Modal */}
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
