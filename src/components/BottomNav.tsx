'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Wallet, Map, BarChart3, Landmark, CreditCard, LineChart, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeWedge = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
};

const navItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, href: '/' },
  { 
    label: 'Tài chính', 
    icon: Wallet, 
    href: '/finance',
    subItems: [
      { label: 'Dòng tiền', icon: Wallet, href: '/finance', startAngle: -90, endAngle: -54, delay: 0 },
      { label: 'Tài sản', icon: Landmark, href: '/finance/assets', startAngle: -54, endAngle: -18, delay: 0.05 },
      { label: 'Nợ/Vay', icon: CreditCard, href: '/finance/debts', startAngle: -18, endAngle: 18, delay: 0.1 },
      { label: 'Net Worth', icon: LineChart, href: '/net-worth', startAngle: 18, endAngle: 54, delay: 0.15 },
      { label: 'Báo cáo', icon: BarChart3, href: '/report', startAngle: 54, endAngle: 90, delay: 0.2 },
    ]
  },
  { label: 'Kế Hoạch', icon: Map, href: '/plan' },
  { label: 'Cài đặt', icon: Settings, href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [radialOpen, setRadialOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | HTMLAnchorElement | null)[]>([]);
  const [maskPos, setMaskPos] = useState<number>(0);

  useEffect(() => {
    const updateMask = () => {
      // Find the active tab index
      let activeIndex = navItems.findIndex(item => {
        if (item.label === 'Tài chính') {
          return radialOpen || pathname === item.href || item.subItems?.some(s => pathname.startsWith(s.href));
        }
        return pathname === item.href;
      });
      
      if (activeIndex === -1) activeIndex = 0; // Fallback

      const el = itemRefs.current[activeIndex];
      if (el) {
        const rect = el.getBoundingClientRect();
        setMaskPos(rect.left + rect.width / 2);
      }
    };
    
    updateMask();
    setTimeout(updateMask, 50);
    window.addEventListener('resize', updateMask);
    return () => window.removeEventListener('resize', updateMask);
  }, [radialOpen, pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setRadialOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close radial menu on route change
  useEffect(() => {
    setRadialOpen(false);
  }, [pathname]);

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      {/* Overlay for radial menu */}
      <AnimatePresence>
        {radialOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRadialOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Separate Background Layer for Masking */}
      <motion.div 
        className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[var(--border)] pointer-events-none"
        animate={{ '--mask-x': `${maskPos}px` } as any}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          WebkitMaskImage: 'radial-gradient(circle at var(--mask-x, 50%) 8px, transparent 36px, black 37px)',
          maskImage: 'radial-gradient(circle at var(--mask-x, 50%) 8px, transparent 36px, black 37px)'
        } as any}
      />

      {/* Nav Content Layer */}
      <div className="relative z-50 px-2 safe-area-bottom">
        <div className="flex items-center justify-between px-4 max-w-md mx-auto relative h-[56px]">
          {navItems.map((item, index) => {
            const isFinanceTab = item.label === 'Tài chính';
            // A tab is active if its href matches, or if it's Finance and a sub-item matches
            const isActive = pathname === item.href || (isFinanceTab && item.subItems?.some(s => pathname.startsWith(s.href)));
            const Icon = item.icon;

            if (isFinanceTab) {
              const isFinanceActive = pathname === item.href || item.subItems?.some(s => pathname.startsWith(s.href));
              const shouldPopUp = radialOpen || isFinanceActive;

              return (
                <div key={item.label} ref={el => { itemRefs.current[index] = el; }} className="relative flex flex-col items-center justify-center h-full w-16">
                  {/* Radial Sub Items SVG Menu */}
                  <AnimatePresence>
                    {radialOpen && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-24px] z-50 pointer-events-none">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                        
                        <svg viewBox="-160 -160 320 320" className="w-[320px] h-[320px] drop-shadow-xl overflow-visible">
                          <defs>
                            <filter id="wedge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
                            </filter>
                          </defs>

                          {item.subItems!.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = pathname === sub.href;
                            const wedgePath = describeWedge(0, 0, 45, 135, sub.startAngle, sub.endAngle);
                            
                            // Center of the slice for text/icon
                            const centerAngle = (sub.startAngle + sub.endAngle) / 2;
                            const cx = polarToCartesian(0, 0, 90, centerAngle).x;
                            const cy = polarToCartesian(0, 0, 90, centerAngle).y;

                            return (
                              <motion.g
                                key={sub.href}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: sub.delay, type: "spring", stiffness: 260, damping: 20 }}
                                className="pointer-events-auto cursor-pointer"
                                onClick={() => {
                                  router.push(sub.href);
                                  setRadialOpen(false);
                                }}
                              >
                                <path
                                  d={wedgePath}
                                  fill={isSubActive ? "#fffaf0" : "white"}
                                  stroke={isSubActive ? "#f97316" : "#f1f5f9"}
                                  strokeWidth={isSubActive ? "2" : "1"}
                                  strokeLinejoin="round"
                                  filter="url(#wedge-shadow)"
                                  className="dark:fill-slate-800 dark:stroke-slate-700 transition-colors"
                                />
                                <foreignObject x={cx - 35} y={cy - 30} width="70" height="60" className="pointer-events-none">
                                  <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none select-none">
                                    <SubIcon className={cn("w-5 h-5 mb-1", isSubActive ? "text-orange-500" : "text-slate-700 dark:text-slate-300")} />
                                    <span className={cn("text-[9px] font-bold leading-tight", isSubActive ? "text-orange-500" : "text-slate-700 dark:text-slate-300")}>
                                      {sub.label}
                                    </span>
                                  </div>
                                </foreignObject>
                              </motion.g>
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Main Toggle Button */}
                  <button
                    onClick={() => setRadialOpen(!radialOpen)}
                    className="relative flex flex-col items-center justify-center w-full h-full outline-none z-50"
                  >
                    <motion.div 
                      className={cn(
                        "flex items-center justify-center rounded-full transition-all duration-300 relative z-50",
                        shouldPopUp ? "bg-emerald-teal text-white shadow-xl w-14 h-14 -translate-y-5" : "text-slate-400 w-10 h-10"
                      )}
                      animate={{ rotate: radialOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {radialOpen ? <X strokeWidth={2.5} className="w-6 h-6" /> : <Icon strokeWidth={shouldPopUp ? 2.5 : 1.5} className="w-6 h-6" />}
                    </motion.div>
                    <span 
                      className={cn(
                        "text-[10px] font-medium transition-all duration-300 absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center whitespace-nowrap",
                        shouldPopUp ? "opacity-0 translate-y-4" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            }

            // Normal tab popping condition: only pop up if active AND radial menu is NOT open
            const shouldNormalPopUp = isActive && !radialOpen;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="h-full w-16 transition-colors outline-none"
              >
                <div ref={el => { itemRefs.current[index] = el; }} className="relative flex flex-col items-center justify-center w-full h-full">
                  <motion.div 
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all duration-300 relative z-50",
                      shouldNormalPopUp ? "bg-emerald-teal text-white shadow-xl w-14 h-14 -translate-y-5" : "text-slate-400 w-10 h-10"
                    )}
                  >
                    <Icon strokeWidth={shouldNormalPopUp ? 2.5 : 1.5} className="w-6 h-6" />
                  </motion.div>
                  <span 
                    className={cn(
                      "text-[10px] font-medium transition-all duration-300 absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center whitespace-nowrap",
                      shouldNormalPopUp ? "opacity-0 translate-y-4" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

