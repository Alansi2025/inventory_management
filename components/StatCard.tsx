import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass = "bg-white dark:bg-slate-900" }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-all hover:scale-[1.02] duration-200`}>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
  );
};