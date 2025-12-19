import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Content } from '@/lib/api';
import { Eye, Lock, ArrowRight } from 'lucide-react';

interface RelatedContentProps {
  currentContentId: string;
  maxItems?: number;
}

export function RelatedContent({ currentContentId, maxItems = 3 }: RelatedContentProps) {
  const [relatedContents, setRelatedContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRelated() {
      try {
        const allContents = await api.getContents();
        // Filter out current content and sort by views (popularity)
        const filtered = allContents
          .filter(c => c.id !== currentContentId)
          .sort((a, b) => b.views - a.views)
          .slice(0, maxItems);
        setRelatedContents(filtered);
      } catch (error) {
        console.error('Failed to fetch related content:', error);
      }
      setLoading(false);
    }

    fetchRelated();
  }, [currentContentId, maxItems]);

  const handleClick = (contentId: string) => {
    navigate(`/unlock/${contentId}`);
  };

  if (loading || relatedContents.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">You May Also Like</h3>
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {relatedContents.map(content => (
          <button
            key={content.id}
            onClick={() => handleClick(content.id)}
            className="glass rounded-xl overflow-hidden text-left hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="relative aspect-video overflow-hidden">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>

            <div className="p-3">
              <h4 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {content.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{content.views} views</span>
                <span className="text-xs text-primary ml-auto">{content.required_ads} ads</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
