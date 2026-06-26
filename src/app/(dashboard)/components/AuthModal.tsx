import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthModal({ isOpen, onClose, message = "Bạn cần đăng nhập để sử dụng tính năng này." }: AuthModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-sm bg-card border border-[var(--border)] rounded-3xl p-6 shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">Chưa đăng nhập</h3>
          <p className="text-sm text-foreground/70 mb-6">{message}</p>
          
          <div className="flex flex-col w-full gap-3">
            <Link 
              href="/login"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]"
            >
              Đăng nhập ngay
            </Link>
            <button 
              onClick={onClose}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

