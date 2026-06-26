'use client';
import dynamic from 'next/dynamic';

const DashboardAreaChart = dynamic(() => import('../DashboardAreaChart'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
});

export default function DashboardAreaChartClient({ chartData }: { chartData: any[] }) {
  return <DashboardAreaChart chartData={chartData} />;
}

