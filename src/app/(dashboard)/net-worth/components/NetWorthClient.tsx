'use client';

import { NetWorthData } from '../data';
import NetWorthHeader from './NetWorthHeader';
import NetWorthStats from './NetWorthStats';
import NetWorthChart from './NetWorthChart';
import StructureDonut from './StructureDonut';
import NetWorthPyramid from './NetWorthPyramid';
import Timeline from './Timeline';
import NetWorthForecast from './NetWorthForecast';
import AISuggestion from './AISuggestion';

interface NetWorthClientProps {
  data: NetWorthData;
  user: any;
}

export default function NetWorthClient({ data, user }: NetWorthClientProps) {
  return (
    <div className="w-full space-y-6">
      <NetWorthHeader />

      <NetWorthStats summary={data.summary} />

      {/* Row 1: Biểu đồ Net Worth - Tháp */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 min-h-[400px]">
          <NetWorthChart data={data.chartData} />
        </div>
        <div className="w-full md:w-1/3 min-h-[400px]">
          <NetWorthPyramid data={data.pyramid} total={data.summary.totalAssets} />
        </div>
      </div>

      {/* Row 2: Cơ cấu tài sản - Cơ cấu nợ */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 min-h-[400px]">
          <StructureDonut 
            title="Cơ cấu tài sản" 
            data={data.assetStructure} 
            total={data.summary.totalAssets} 
            detailLink="/finance/assets"
            linkText="Xem chi tiết tài sản"
          />
        </div>
        <div className="w-full md:w-1/2 min-h-[400px]">
          <StructureDonut 
            title="Cơ cấu nợ" 
            data={data.debtStructure} 
            total={data.summary.totalDebt} 
            detailLink="/finance/debts"
            linkText="Xem chi tiết nợ"
          />
        </div>
      </div>

      {/* Row 3: Dòng thời gian - Dự báo */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 min-h-[400px]">
          <Timeline data={data.timeline} />
        </div>
        <div className="w-full md:w-2/3 min-h-[400px]">
          <NetWorthForecast data={data.forecast} current={data.summary.netWorth} />
        </div>
      </div>

      <AISuggestion ratio={data.summary.debtToAssetRatio} />
    </div>
  );
}

