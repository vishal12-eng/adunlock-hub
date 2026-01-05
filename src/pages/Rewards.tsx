import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ReferralSection } from '@/components/referral/ReferralWidgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Coins,
  CreditCard,
  TrendingDown,
  Gift,
  Zap,
  HelpCircle,
  Share2,
  Users,
  CheckCircle,
  Star,
  Target
} from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { useSEO } from '@/hooks/useSEO';
import { cn } from '@/lib/utils';

export default function Rewards() {
  useSEO({
    title: 'Rewards & Referrals',
    description: 'Earn coins, unlock cards, and reduced ads by inviting friends. Use rewards to unlock content faster.',
    url: '/rewards',
  });

  const { 
    coins, 
    bonusUnlocks, 
    adsReduction, 
    totalReferrals,
    config,
    isLoading 
  } = useReferral();
  
  const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'guide'>('earn');

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead />
      <Header />
      
      <main className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Balance Overview */}
          <Card className="glass-intense border-primary/20 mb-8 overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardContent className="relative p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Your Rewards Balance</h1>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 hover-lift">
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{coins}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Coins</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 hover-lift">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{bonusUnlocks}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Unlock Cards</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 hover-lift">
                  <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-accent mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{adsReduction}%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Ads Reduction</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 hover-lift">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{totalReferrals}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation - Horizontal scrollable on mobile */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <Button
              variant={activeTab === 'earn' ? 'default' : 'outline'}
              onClick={() => setActiveTab('earn')}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 touch-active"
              size="sm"
            >
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Earn Rewards</span>
            </Button>
            <Button
              variant={activeTab === 'spend' ? 'default' : 'outline'}
              onClick={() => setActiveTab('spend')}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 touch-active"
              size="sm"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">How to Spend</span>
            </Button>
            <Button
              variant={activeTab === 'guide' ? 'default' : 'outline'}
              onClick={() => setActiveTab('guide')}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 touch-active"
              size="sm"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Full Guide</span>
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'earn' && (
            <ReferralSection />
          )}

          {activeTab === 'spend' && (
            <div className="space-y-6">
              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    How to Use Your Coins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Skip 1 Ad</p>
                          <p className="text-sm text-primary">{config.coinsPerAdSkip || 50} coins</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use coins to skip individual ads during the unlock process. Great for saving time!
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Full Unlock</p>
                          <p className="text-sm text-primary">{config.coinsForFullUnlock || 200} coins</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Instantly unlock any content without watching any ads. Skip the entire process!
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                          <Target className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Buy Unlock Card</p>
                          <p className="text-sm text-primary">{config.coinsToUnlock} coins</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Convert coins into unlock cards. Each card gives you one instant full unlock.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Priority Access</p>
                          <p className="text-sm text-primary">{config.priorityUnlockCoins} coins</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get 24 hours of priority access with reduced wait times and faster unlocks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-400" />
                    How to Use Unlock Cards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Instant Full Unlock</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Each unlock card lets you instantly unlock any content without watching any ads. 
                          Simply click "Use Unlock Card" on any content page to immediately access the download.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            Works on any content regardless of ad count
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            No waiting, no ads, instant access
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            Earned through referrals or purchased with coins
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* How to Earn */}
              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    How to Earn Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Share Your Referral Link</h4>
                        <p className="text-sm text-muted-foreground">
                          Copy your unique referral link from the "Earn Rewards" tab and share it with friends 
                          via social media, messaging apps, or any other channel.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-accent-foreground">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Friend Joins via Your Link</h4>
                        <p className="text-sm text-muted-foreground">
                          When someone clicks your link and visits the site, they become your referral. 
                          They also get a welcome bonus of {config.welcomeBonusCoins || 25} coins and {config.welcomeBonusUnlocks || 1} unlock card!
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Earn Your Rewards</h4>
                        <p className="text-sm text-muted-foreground">
                          When your referral completes their first unlock, you earn:
                        </p>
                        <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span><strong className="text-foreground">{config.coinsPerReferral}</strong> coins</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-400" />
                            <span><strong className="text-foreground">{config.bonusUnlocksPerReferral}</strong> unlock card</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-accent" />
                            <span><strong className="text-foreground">{config.adsReductionPerReferral}%</strong> ads reduction (up to {config.maxAdsReduction}%)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips for Success */}
              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Tips for More Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-secondary/30 flex items-start gap-3">
                      <Share2 className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Share on Social Media</p>
                        <p className="text-xs text-muted-foreground">Post your link on Twitter, Facebook, or Instagram</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 flex items-start gap-3">
                      <Users className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Tell Your Friends</p>
                        <p className="text-xs text-muted-foreground">Share via WhatsApp, Telegram, or Discord</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 flex items-start gap-3">
                      <Gift className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Mention the Bonus</p>
                        <p className="text-xs text-muted-foreground">Let friends know they get rewards too!</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 flex items-start gap-3">
                      <Target className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Be Consistent</p>
                        <p className="text-xs text-muted-foreground">Regular sharing = more referrals over time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="glass border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="font-medium text-foreground text-sm mb-1">How long does my referral link last?</p>
                      <p className="text-xs text-muted-foreground">Your referral link never expires. Once generated, it's yours forever.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="font-medium text-foreground text-sm mb-1">When do I get my rewards?</p>
                      <p className="text-xs text-muted-foreground">Rewards are credited when your referral completes their first unlock and meets the validation requirements.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="font-medium text-foreground text-sm mb-1">Is there a limit to how many people I can refer?</p>
                      <p className="text-xs text-muted-foreground">No! You can refer as many people as you want. However, there's a daily reward limit of {config.maxRewardsPerDay || 10} referrals.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="font-medium text-foreground text-sm mb-1">Do my rewards expire?</p>
                      <p className="text-xs text-muted-foreground">Coins and unlock cards don't expire. Ads reduction is permanent. Priority access lasts 24 hours after purchase.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="font-medium text-foreground text-sm mb-1">Can I refer myself?</p>
                      <p className="text-xs text-muted-foreground">No, self-referrals are automatically detected and blocked by our anti-fraud system.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
