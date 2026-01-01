import { useState, useEffect } from 'react';
import { Mail, Gift, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// DB CHANGE NEEDED: Create 'email_subscribers' table with columns:
// - id (uuid), email (text unique), session_id (text), subscribed_at (timestamp),
// - bonus_claimed (boolean), unsubscribed_at (timestamp nullable)
// DB CHANGE NEEDED: Add RLS policies for insert (anyone) and select/update (admin only)

const STORAGE_KEY = 'adnexus_email_collected';
const POPUP_DELAY = 30000; // Show after 30 seconds
const POPUP_SHOWN_KEY = 'adnexus_email_popup_shown';

function isEmailCollected(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function markEmailCollected() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

function hasPopupShown(): boolean {
  return sessionStorage.getItem(POPUP_SHOWN_KEY) === 'true';
}

function markPopupShown() {
  sessionStorage.setItem(POPUP_SHOWN_KEY, 'true');
}

interface EmailCollectorProps {
  onSuccess?: () => void;
  trigger?: 'auto' | 'manual';
}

export function EmailCollector({ onSuccess, trigger = 'auto' }: EmailCollectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    if (trigger === 'auto' && !isEmailCollected() && !hasPopupShown()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        markPopupShown();
      }, POPUP_DELAY);
      
      return () => clearTimeout(timer);
    }
  }, [trigger]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call (in real implementation, this would send to an edge function)
    // The edge function would insert into the email_subscribers table
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store locally for demo
    const emails = JSON.parse(localStorage.getItem('collected_emails') || '[]');
    emails.push({ email, timestamp: Date.now() });
    localStorage.setItem('collected_emails', JSON.stringify(emails));
    
    markEmailCollected();
    setSubmitted(true);
    setLoading(false);
    
    toast.success('Thanks! You got 2 bonus unlocks!');
    onSuccess?.();
    
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  if (isEmailCollected() && trigger === 'auto') {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-intense border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Get 2 Free Unlocks!
          </DialogTitle>
        </DialogHeader>
        
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">You're In!</h3>
            <p className="text-muted-foreground">
              2 bonus unlocks added to your account!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Subscribe to our newsletter and get <span className="text-primary font-semibold">2 free unlocks</span> instantly! Be the first to know about new premium content.
            </p>
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Get My Free Unlocks
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Inline email collector for embedding in pages
export function InlineEmailCollector() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(isEmailCollected());
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const emails = JSON.parse(localStorage.getItem('collected_emails') || '[]');
    emails.push({ email, timestamp: Date.now() });
    localStorage.setItem('collected_emails', JSON.stringify(emails));
    
    markEmailCollected();
    setSubmitted(true);
    setLoading(false);
    
    toast.success('Thanks! You got 2 bonus unlocks!');
  };
  
  if (submitted) {
    return (
      <div className="glass rounded-xl p-4 text-center">
        <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
        <p className="text-sm text-foreground">Thanks for subscribing!</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">Get 2 Free Unlocks!</span>
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
          {loading ? '...' : 'Get'}
        </Button>
      </div>
    </form>
  );
}
