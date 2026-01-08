import { useState } from 'react';
import { Mail, Gift, Check, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'adnexus_newsletter_subscribed';

interface NewsletterSubscribeProps {
  source: 'footer' | 'shop' | 'unlock_success' | 'popup';
  variant?: 'inline' | 'card' | 'minimal';
  onSuccess?: () => void;
  showPreferences?: boolean;
}

interface SubscriptionPreferences {
  new_content: boolean;
  daily_rewards: boolean;
  updates: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
}

function isSubscribed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function markSubscribed(email: string) {
  localStorage.setItem(STORAGE_KEY, 'true');
  localStorage.setItem('adnexus_subscriber_email', email);
}

export function NewsletterSubscribe({ 
  source, 
  variant = 'inline',
  onSuccess,
  showPreferences = false 
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed());
  const [preferences, setPreferences] = useState<SubscriptionPreferences>({
    new_content: true,
    daily_rewards: true,
    updates: true,
    frequency: 'instant',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Call the newsletter webhook edge function
      const { data, error } = await supabase.functions.invoke('newsletter-webhook', {
        body: {
          email: email.trim().toLowerCase(),
          source,
          preferences,
        },
      });

      if (error) throw error;

      if (data?.duplicate) {
        toast.info('You\'re already subscribed!');
      } else {
        markSubscribed(email);
        setSubscribed(true);
        toast.success('🎉 Subscribed! Check your email for a welcome message.');
        onSuccess?.();
      }

      // Also store locally for admin panel to read
      const existingEmails = JSON.parse(localStorage.getItem('collected_emails') || '[]');
      if (!existingEmails.some((e: any) => e.email === email.toLowerCase())) {
        existingEmails.push({
          email: email.toLowerCase(),
          timestamp: Date.now(),
          source,
          preferences,
        });
        localStorage.setItem('collected_emails', JSON.stringify(existingEmails));
      }

    } catch (error) {
      console.error('Subscription error:', error);
      // Fallback to localStorage only
      const existingEmails = JSON.parse(localStorage.getItem('collected_emails') || '[]');
      existingEmails.push({
        email: email.toLowerCase(),
        timestamp: Date.now(),
        source,
        preferences,
      });
      localStorage.setItem('collected_emails', JSON.stringify(existingEmails));
      
      markSubscribed(email);
      setSubscribed(true);
      toast.success('🎉 Subscribed successfully!');
      onSuccess?.();
    }

    setLoading(false);
  };

  if (subscribed && variant !== 'card') {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Check className="w-4 h-4" />
        <span>You're subscribed!</span>
      </div>
    );
  }

  // Minimal variant for footer
  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
            disabled={loading}
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </form>
    );
  }

  // Card variant for shop/unlock success
  if (variant === 'card') {
    return (
      <div className="glass-intense rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Stay Updated!</h3>
            <p className="text-sm text-muted-foreground">Get notified about new premium apps</p>
          </div>
        </div>

        {subscribed ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-medium">You're on the list!</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll notify you when new content is available
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
                disabled={loading}
              />
            </div>

            {showPreferences && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground font-medium">Notify me about:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={preferences.new_content}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, new_content: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">🆕 New premium apps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={preferences.daily_rewards}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, daily_rewards: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">🎁 Daily rewards & bonuses</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={preferences.updates}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, updates: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">📢 Important updates</span>
                  </label>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Subscribe & Get Updates
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Unsubscribe anytime. We respect your privacy.
            </p>
          </form>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Get notified when new Premium Apps are added 🚀
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-secondary/50 border-border text-sm"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </div>
    </form>
  );
}

// Footer newsletter section
export function FooterNewsletter() {
  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="max-w-md mx-auto text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Never Miss New Content
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get notified when we add new premium apps and exclusive content.
        </p>
        <NewsletterSubscribe source="footer" variant="minimal" />
      </div>
    </div>
  );
}

// Unlock success newsletter prompt
export function UnlockSuccessNewsletter() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isSubscribed()) return null;

  return (
    <div className="mt-6 animate-fade-in">
      <NewsletterSubscribe 
        source="unlock_success" 
        variant="card"
        onSuccess={() => setDismissed(true)}
        showPreferences
      />
    </div>
  );
}
