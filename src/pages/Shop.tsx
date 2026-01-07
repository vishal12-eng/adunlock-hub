import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ShopSection } from '@/components/shop/ShopSection';
import { DailyRewardsSection } from '@/components/shop/DailyRewardsSection';
import { SpendingHistory } from '@/components/shop/SpendingHistory';
import { ShopStats } from '@/components/shop/ShopStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Coins,
  CreditCard,
  Gift,
  History,
  ShoppingBag,
  Volume2,
  VolumeX,
  BarChart3,
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { useSEO } from '@/hooks/useSEO';
import { cn } from '@/lib/utils';

export default function Shop() {
  useSEO({
    title: 'Shop & Rewards',
    description: 'Buy unlock cards with coins, claim daily rewards, and track your spending history.',
    url: '/shop',
  });

  const { 
    coins, 
    unlockCards, 
    soundEnabled,
    toggleSound,
    isLoading 
  } = useShop();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-5xl">
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
        <div className="container mx-auto max-w-5xl">
          {/* Back Button + Sound Toggle */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="gap-2"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Sound Off</span>
                </>
              )}
            </Button>
          </div>

          {/* Balance Overview */}
          <Card className="glass-intense border-primary/20 mb-8 overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardContent className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Shop & Rewards</h1>
                <Link to="/rewards">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Gift className="w-4 h-4" />
                    <span className="hidden sm:inline">Referral Rewards</span>
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 hover-lift">
                  <div className="flex items-center gap-3">
                    <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <div>
                      <p className="text-2xl sm:text-4xl font-bold text-foreground animate-counter">{coins}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Coins</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 hover-lift">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                    <div>
                      <p className="text-2xl sm:text-4xl font-bold text-foreground animate-counter">{unlockCards}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Unlock Cards</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="shop" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="shop" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Shop</span>
              </TabsTrigger>
              <TabsTrigger value="daily" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Daily</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shop">
              <ShopSection />
            </TabsContent>

            <TabsContent value="daily">
              <DailyRewardsSection />
            </TabsContent>

            <TabsContent value="history">
              <SpendingHistory />
            </TabsContent>

            <TabsContent value="stats">
              <ShopStats />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
