import Link from 'next/link';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Coffee, Heart, Brain, Dumbbell, Zap, Music, ShoppingBag, Home, Car, TrendingUp } from 'lucide-react';
import { getDashboardRecentTransactions } from '../finance/actions';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatMoney = (amount: number) => {
  return moneyFormatter.format(amount).replace('₫', '').trim() + ' ₫';
};

const CATEGORY_ICONS: Record<string, any> = {
  'Ăn uống': Coffee,
  'Di chuyển': Car,
  'Nhà cửa & Hóa đơn': Home,
  'Mua sắm': ShoppingBag,
  'Sức khỏe': Heart,
  'Giải trí & Quan hệ': Music,
  'Học tập & Phát triển': Brain,
  'Quà tặng & Thu nhập khác': Zap,
  'Lương & Thưởng': TrendingUp,
  'Làm thêm (Freelance)': Zap,
  'Lãi & Cổ tức': TrendingUp,
  'Quỹ dự phòng': Wallet,
  'Tích lũy dài hạn': PiggyBank,
  'Đầu tư': TrendingUp,
  'Bỏ heo/Tiết kiệm tự do': PiggyBank,
};
import { Wallet, PiggyBank } from 'lucide-react';

export default async function DashboardRecentTransactions() {
  const transactions = await getDashboardRecentTransactions(5);

  return (
    <div className="bg-card border border-slate-200/60 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-foreground tracking-tight">Gần đây</h3>
          <p className="text-sm text-foreground/40 font-medium">5 giao dịch mới nhất</p>
        </div>
        <Link href="/finance" className="text-xs font-bold text-emerald-teal hover:underline flex items-center gap-1">
          Tất cả <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-sm font-medium text-foreground/40">Chưa có giao dịch nào.</p>
          </div>
        ) : (
          transactions.map((t: any) => {
            const Icon = CATEGORY_ICONS[t.category] || ShoppingBag;
            const isIncome = t.type === 'income';
            const isSaving = t.type === 'saving';

            return (
              <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 rounded-[20px] bg-slate-50/50 hover:bg-slate-100/50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-slate-100/50 dark:border-white/5 group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-emerald-100 text-emerald-600' : 
                    isSaving ? 'bg-indigo-100 text-indigo-600' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-violet-600 transition-colors">
                      {t.title}
                    </p>
                    <p className="text-xs font-medium text-foreground/40 truncate flex items-center gap-1">
                      {t.category} • {new Date(t.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                      {t.entered_by && (
                        <span className="inline-flex items-center gap-1 bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
                          👤 {t.entered_by}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold font-heading ${
                    isIncome ? 'text-emerald-600' : 
                    isSaving ? 'text-indigo-600' : 
                    'text-foreground'
                  }`}>
                    {isIncome ? '+' : isSaving ? '-' : '-'}{formatMoney(t.amount)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

