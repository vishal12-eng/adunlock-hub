import { Share2, Twitter, Facebook, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialShareProps {
  title: string;
  contentId: string;
}

export function SocialShare({ title, contentId }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/unlock/${contentId}`;
  const shareText = `Check out "${title}" - Unlock premium content!`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 glass rounded-lg hover:bg-primary/10 hover:border-primary/40 transition-all"
          title="Share"
        >
          <Share2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </button>
      )}

      <button
        onClick={handleTwitterShare}
        className="p-2 glass rounded-lg hover:bg-primary/10 hover:border-primary/40 transition-all"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
      </button>

      <button
        onClick={handleFacebookShare}
        className="p-2 glass rounded-lg hover:bg-primary/10 hover:border-primary/40 transition-all"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4 text-muted-foreground hover:text-primary" />
      </button>

      <button
        onClick={handleCopyLink}
        className="p-2 glass rounded-lg hover:bg-primary/10 hover:border-primary/40 transition-all"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Link2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
        )}
      </button>
    </div>
  );
}
