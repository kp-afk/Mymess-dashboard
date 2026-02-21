import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: 'indigo' | 'rose' | 'amber' | 'emerald' | 'violet';
}

const colorMap: Record<StatsCardProps['color'], {
  icon: string;
  iconBg: string;
  bar: string;
}> = {
  indigo:  { icon: 'text-indigo-600 dark:text-indigo-400',  iconBg: 'bg-indigo-50 dark:bg-indigo-950',  bar: 'bg-indigo-600'  },
  rose:    { icon: 'text-rose-600 dark:text-rose-400',      iconBg: 'bg-rose-50 dark:bg-rose-950',      bar: 'bg-rose-500'    },
  amber:   { icon: 'text-amber-600 dark:text-amber-400',    iconBg: 'bg-amber-50 dark:bg-amber-950',    bar: 'bg-amber-500'   },
  emerald: { icon: 'text-emerald-600 dark:text-emerald-400',iconBg: 'bg-emerald-50 dark:bg-emerald-950',bar: 'bg-emerald-500' },
  violet:  { icon: 'text-violet-600 dark:text-violet-400',  iconBg: 'bg-violet-50 dark:bg-violet-950',  bar: 'bg-violet-500'  },
};

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
          <Icon size={18} className={c.icon} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            trend.isUp
              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
              : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950'
          }`}>
            {trend.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
      </div>
    </div>
  );
}
