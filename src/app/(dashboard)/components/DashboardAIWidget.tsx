'use client';

import { useState } from 'react';
import { Sparkles, Send, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardAIWidget() {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    // TODO: Connect this to actual AI action
    setTimeout(() => {
      setIsSubmitting(false);
      setInput('');
      router.push('/finance?add=true&text=' + encodeURIComponent(input));
    }, 500);
  };

  return (
    <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent border border-violet-500/20 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col h-full relative overflow-hidden group">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground tracking-tight flex items-center gap-1.5">
            Trợ lý AI <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          </h3>
          <p className="text-xs text-foreground/50 font-medium">Savora Copilot</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center mb-6">
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-white/5 shadow-sm">
          <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
            "Chào bạn! Bạn đang duy trì thói quen rất tốt. Hãy nhập một giao dịch bằng ngôn ngữ tự nhiên để mình ghi lại nhé."
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 mt-auto">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="VD: Cà phê 30k..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full pl-5 pr-12 py-3.5 text-sm font-medium text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

