'use client';

import { useAiForecast, useAiInsights } from '@/hooks/useAi';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, LineChart as LineChartIcon, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AiInsightType } from '@/types/ai';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [insightType, setInsightType] = useState<AiInsightType>('monthly');
  const { data: forecastData, isLoading: forecastLoading } = useAiForecast();
  const { data: insightsData, isLoading: insightsLoading } = useAiInsights(insightType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">Deep dive into your financial habits with AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Forecast Card */}
        <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">AI Forecast</h2>
          </div>
          
          {forecastLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : forecastData ? (
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Estimated Month Total</p>
                <p className="text-3xl font-bold">{formatCurrency(forecastData.estimated_month_total, 'USD')}</p>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  {forecastData.estimated_savings > 0 ? (
                    <span className="text-green-500 font-medium flex items-center gap-1">
                      <TrendingUp size={14} /> {formatCurrency(forecastData.estimated_savings, 'USD')} projected savings
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <TrendingDown size={14} /> Over budget trajectory
                    </span>
                  )}
                </div>
              </div>

              {forecastData.risk_categories && forecastData.risk_categories.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-amber-500" />
                    Areas to watch
                  </h4>
                  <div className="space-y-3">
                    {forecastData.risk_categories.map((risk, idx) => (
                      <div key={idx} className="bg-muted p-3 rounded-lg text-sm">
                        <span className="font-semibold">{risk.category}:</span> {risk.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-auto pt-4 text-xs text-foreground/50 flex items-start gap-1">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <p>{forecastData.disclaimer || `Forecast based on ${forecastData.days_of_data} days of current month data.`}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[200px] text-foreground/50">
              Not enough data for forecast.
            </div>
          )}
        </div>

        {/* Insights Card */}
        <div className="col-span-1 md:col-span-3 lg:col-span-2 bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">AI Insights</h2>
            </div>
            
            <div className="flex bg-muted p-1 rounded-lg">
              {(['daily', 'weekly', 'monthly'] as AiInsightType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setInsightType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    insightType === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {insightsLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : insightsData ? (
            <div className="flex-1 flex flex-col">
              <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-lg leading-relaxed">{insightsData.summary}</p>
              </div>
              
              <h4 className="font-medium mb-4 text-sm text-foreground/60 uppercase tracking-wider">Key Highlights</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {insightsData.highlights && insightsData.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 border border-border rounded-xl">
                    <div className={`p-2 rounded-full ${
                      highlight.direction === 'up' 
                        ? 'bg-red-500/10 text-red-500' 
                        : 'bg-green-500/10 text-green-500'
                    }`}>
                      {highlight.direction === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium">{highlight.category}</p>
                      <p className={`text-sm ${
                        highlight.direction === 'up' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {highlight.direction === 'up' ? '+' : '-'}{highlight.change_pct}% from average
                      </p>
                    </div>
                  </div>
                ))}
                
                {(!insightsData.highlights || insightsData.highlights.length === 0) && (
                  <div className="col-span-2 py-8 text-center text-foreground/50 text-sm">
                    No significant highlights detected for this period.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px] text-foreground/50">
              Select a period to generate insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
