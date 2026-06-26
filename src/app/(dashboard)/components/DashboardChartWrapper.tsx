import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getWeeklyOverview, getDashboardCategorySplit } from '../finance/actions';
import DashboardChartTabsClient from './DashboardChartTabsClient';

export default async function DashboardChartWrapper() {
  const [chartData, categorySplitData] = await Promise.all([
    getWeeklyOverview(),
    getDashboardCategorySplit()
  ]);

  return (
    <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">Hoạt động tài chính</h3>
          <p className="text-sm text-foreground/40 font-medium">Theo dõi dòng tiền & phân bổ</p>
        </div>
        <Link href="/finance" className="text-xs font-bold text-emerald-teal hover:underline flex items-center gap-1">
          Xem chi tiết <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="flex-1 mt-4">
        <DashboardChartTabsClient weeklyData={chartData} categorySplit={categorySplitData} />
      </div>
    </div>
  );
}

