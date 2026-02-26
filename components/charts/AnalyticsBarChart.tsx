import { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { currencyFormat } from '@/lib/billSplit';
import { useTheme } from 'next-themes';

interface BarChartProps {
  data: { label: string; value: number }[];
  currency?: string;
}

export function AnalyticsBarChart({ data, currency = 'USD' }: BarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(() => ({
    fill: isDark ? '#6366f1' : '#4f46e5',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  }), [isDark]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-foreground/50 text-sm">
        No data available
      </div>
    );
  }

  // Limit labels to prevent overcrowding
  const displayData = data.map((item, index) => {
    const showLabel = data.length <= 7 || index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 6) === 0;
    return {
      ...item,
      label: showLabel ? item.label : '',
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: colors.text }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: colors.text }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: colors.text, marginBottom: 4 }}
          formatter={(value) => [currencyFormat(Number(value) || 0, currency), 'Amount']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {displayData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors.fill} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
