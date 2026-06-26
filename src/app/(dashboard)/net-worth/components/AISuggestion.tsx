'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AISuggestion({ ratio }: { ratio: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-emerald-800 dark:text-emerald-300">Gợi ý cho bạn</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-0.5">
            Bạn đang đi đúng hướng! Tỷ lệ nợ/tài sản ở mức an toàn ({ratio}%). Tiếp tục duy trì thói quen tiết kiệm và đầu tư đều đặn nhé!
          </p>
        </div>
      </div>
      <Link href="#" className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
        Xem gợi ý chi tiết <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

