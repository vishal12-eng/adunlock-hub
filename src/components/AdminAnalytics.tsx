import { TrendingUp, TrendingDown, BarChart2, PieChart, Activity } from 'lucide-react';

interface AnalyticsData {
  totalContents: number;
  totalViews: number;
  totalUnlocks: number;
  estimatedEarnings: number;
  contents: Array<{
    id: string;
    title: string;
    views: number;
    unlocks: number;
    required_ads: number;
  }>;
}

interface AdminAnalyticsProps {
  data: AnalyticsData;
}

export function AdminAnalytics({ data }: AdminAnalyticsProps) {
  const { totalViews, totalUnlocks, contents } = data;

  // Calculate conversion rate
  const conversionRate = totalViews > 0 ? ((totalUnlocks / totalViews) * 100).toFixed(1) : '0';
  
  // Calculate average revenue per content
  const avgRevenuePerContent = contents.length > 0 
    ? (data.estimatedEarnings / contents.length).toFixed(2) 
    : '0.00';

  // Find top performer
  const topContent = contents.reduce((best, current) => 
    current.unlocks > (best?.unlocks || 0) ? current : best, 
    contents[0]
  );

  // Find underperformers (high views, low unlocks)
  const underperformers = contents
    .filter(c => c.views > 10 && (c.unlocks / c.views) < 0.1)
    .slice(0, 3);

  // Calculate ad efficiency
  const avgAdsPerUnlock = contents.length > 0
    ? (contents.reduce((sum, c) => sum + c.required_ads * c.unlocks, 0) / Math.max(totalUnlocks, 1)).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Conversion Rate</span>
            <div className={`flex items-center gap-1 text-xs font-medium ${
              parseFloat(conversionRate) >= 10 ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {parseFloat(conversionRate) >= 10 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {parseFloat(conversionRate) >= 10 ? 'Good' : 'Improve'}
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Views → Unlocks</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Avg Revenue/Content</span>
            <BarChart2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">${avgRevenuePerContent}</p>
          <p className="text-xs text-muted-foreground mt-1">Per content item</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Avg Ads/Unlock</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">{avgAdsPerUnlock}</p>
          <p className="text-xs text-muted-foreground mt-1">Ad impressions per unlock</p>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer */}
        {topContent && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground">Top Performer</h3>
            </div>
            <div className="space-y-3">
              <p className="font-medium text-foreground line-clamp-1">{topContent.title}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {topContent.views} views
                </span>
                <span className="text-green-400 font-medium">
                  {topContent.unlocks} unlocks
                </span>
                <span className="text-primary">
                  {((topContent.unlocks / Math.max(topContent.views, 1)) * 100).toFixed(1)}% rate
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Underperformers */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-foreground">Needs Attention</h3>
          </div>
          {underperformers.length > 0 ? (
            <div className="space-y-2">
              {underperformers.map((content) => (
                <div key={content.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm text-muted-foreground line-clamp-1 flex-1 mr-4">
                    {content.title}
                  </p>
                  <span className="text-xs text-yellow-400 font-medium whitespace-nowrap">
                    {((content.unlocks / content.views) * 100).toFixed(1)}% rate
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All content is performing well! 🎉
            </p>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Revenue Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Increase Ad Count</p>
            <p className="text-xs text-muted-foreground">
              Premium content should require 3+ ads for maximum revenue.
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Add Thumbnails</p>
            <p className="text-xs text-muted-foreground">
              Content with thumbnails gets 2x more clicks on average.
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Better Titles</p>
            <p className="text-xs text-muted-foreground">
              Action-oriented titles drive higher conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
