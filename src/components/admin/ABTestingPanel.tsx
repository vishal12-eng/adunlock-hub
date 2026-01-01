import { useEffect } from 'react';
import { useABTestResults, clearABTestData, AB_TESTS } from '@/hooks/useABTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FlaskConical, 
  TrendingUp, 
  TrendingDown,
  Trash2,
  RefreshCw,
  Target,
  Eye,
  MousePointer
} from 'lucide-react';
import { toast } from 'sonner';

export function ABTestingPanel() {
  const { results, refresh, clearData } = useABTestResults();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClearData = () => {
    clearData();
    refresh();
    toast.success('A/B test data cleared');
  };

  // Group results by test
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.testId]) {
      acc[result.testId] = [];
    }
    acc[result.testId].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  // Find the winning variant for each test
  const getWinner = (testResults: typeof results) => {
    if (testResults.length === 0) return null;
    const sorted = [...testResults].sort((a, b) => b.conversionRate - a.conversionRate);
    const winner = sorted[0];
    const runnerUp = sorted[1];
    
    // Only declare winner if significantly better (>10% relative improvement)
    if (runnerUp && winner.impressions >= 10 && runnerUp.impressions >= 10) {
      const improvement = ((winner.conversionRate - runnerUp.conversionRate) / runnerUp.conversionRate) * 100;
      if (improvement > 10) {
        return { variant: winner.variant, improvement };
      }
    }
    return null;
  };

  const getTestName = (testId: string) => {
    const test = Object.values(AB_TESTS).find(t => t.id === testId);
    return test?.name || testId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">A/B Testing Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearData}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>

      {/* Active Tests Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-intense border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(AB_TESTS).length}</p>
                <p className="text-sm text-muted-foreground">Active Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-intense border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {results.reduce((sum, r) => sum + r.impressions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-intense border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MousePointer className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {results.reduce((sum, r) => sum + r.conversions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {Object.keys(groupedResults).length === 0 ? (
        <Card className="glass-intense border-border/30">
          <CardContent className="p-8 text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Test Data Yet</h3>
            <p className="text-muted-foreground">
              A/B test results will appear here as users interact with the site.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([testId, testResults]) => {
            const winner = getWinner(testResults);
            const totalImpressions = testResults.reduce((sum, r) => sum + r.impressions, 0);

            return (
              <Card key={testId} className="glass-intense border-border/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {getTestName(testId)}
                    </CardTitle>
                    {winner && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Winner: {winner.variant} (+{winner.improvement.toFixed(1)}%)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testResults.map(result => {
                    const isWinner = winner?.variant === result.variant;
                    const trafficShare = totalImpressions > 0 
                      ? (result.impressions / totalImpressions) * 100 
                      : 0;

                    return (
                      <div 
                        key={result.variant} 
                        className={`p-4 rounded-lg ${
                          isWinner 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={isWinner ? 'default' : 'secondary'}>
                              {result.variant.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {isWinner && (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {result.conversionRate.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Conversion Rate</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Impressions</p>
                            <p className="font-medium">{result.impressions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-medium">{result.conversions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Traffic Share</p>
                            <p className="font-medium">{trafficShare.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress 
                            value={result.conversionRate} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available Tests Reference */}
      <Card className="glass-intense border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Available Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(AB_TESTS).map(([key, test]) => (
              <div key={key} className="p-3 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground">{test.name}</p>
                <p className="text-sm text-muted-foreground">ID: {test.id}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {test.variants.map(variant => (
                    <Badge key={variant} variant="outline" className="text-xs">
                      {variant}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
