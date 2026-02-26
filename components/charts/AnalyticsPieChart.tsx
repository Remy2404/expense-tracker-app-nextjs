import { useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { currencyFormat } from '@/lib/billSplit';
import { useTheme } from 'next-themes';

interface PieChartData {
  name: string;
  amount: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  currency?: string;
}

const DEFAULT_COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function AnalyticsPieChart({ data, currency = 'USD' }: PieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(() => ({
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

  // Assign colors to each category
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsPieChart>
        <Pie
          data={coloredData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
        >
          {coloredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={(value, name) => [
            currencyFormat(Number(value) || 0, currency),
            name
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ color: colors.text, fontSize: 12 }}>{value}</span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
