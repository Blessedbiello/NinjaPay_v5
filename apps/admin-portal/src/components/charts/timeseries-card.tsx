"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

type TimePoint = {
  label: string;
  tps: number;
  latency: number;
};

type TimeSeriesCardProps = {
  data: TimePoint[];
};

const formatLatency = (value: number) => `${value}ms`;
const formatTps = (value: number) => `${value.toLocaleString('en-US')} TPS`;

export function TimeSeriesCard({ data }: TimeSeriesCardProps) {
  const chartData: TimePoint[] = data.length ? data : [{ label: 'no data', tps: 0, latency: 0 }];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Encrypted TPS vs. Arcium Latency</h3>
          <p className="text-xs text-muted-foreground">Last 60 minutes, sampled every 5 minutes.</p>
        </div>
        <DynamicIcon name="line-chart" className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="h-72 w-full px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => value.toLocaleString('en-US')}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value}ms`}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{ background: 'rgba(9, 9, 17, 0.85)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.12)' }}
              formatter={(value, name) =>
                name === 'tps'
                  ? [formatTps(value as number), 'Encrypted TPS']
                  : [formatLatency(value as number), 'Latency']
              }
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value) => (value === 'tps' ? 'Encrypted TPS' : 'Latency (p95)')}
            />
            <Area
              type="monotone"
              dataKey="tps"
              stroke="#0EA5E9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTps)"
              yAxisId="left"
              name="tps"
            />
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#F97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLatency)"
              yAxisId="right"
              name="latency"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
