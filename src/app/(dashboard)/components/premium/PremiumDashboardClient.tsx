'use client';

import PremiumStatCards from './PremiumStatCards';
import PremiumCashflow from './PremiumCashflow';
import PremiumGoals from './PremiumGoals';
import PremiumNetWorthWidget from './PremiumNetWorthWidget';

interface PremiumDashboardClientProps {
  data: any;
  user: any;
}

export default function PremiumDashboardClient({ data, user }: PremiumDashboardClientProps) {
  return (
    <div className="w-full space-y-6">
      {/* ─── Row 1: 4 Stat Cards ────────────────────── */}
      <PremiumStatCards data={data.summary} />

      {/* ─── Row 2: Cashflow (left 2/3) + Right col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Area chart */}
        <div className="lg:col-span-2">
          <PremiumCashflow
            data={data.cashflowData}
            cashflowByPeriod={data.cashflowByPeriod}
            netTotal={data.summary.netWorth}
          />
        </div>

        {/* Right: Goals card + Net Worth CTA */}
        <div className="flex flex-col gap-6">
          <div className="flex-1">
            <PremiumGoals data={data.goals} />
          </div>
          <PremiumNetWorthWidget data={data.netWorthSummary} />
        </div>
      </div>
    </div>
  );
}

