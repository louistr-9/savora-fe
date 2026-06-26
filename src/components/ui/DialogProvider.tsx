'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogType = 'alert' | 'confirm';

interface DialogOptions {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: ReactNode;
  destructive?: boolean; // If true, confirm button is red
}

interface DialogContextType {
  showAlert: (message: string | ReactNode, options?: Omit<DialogOptions, 'message' | 'type'>) => Promise<void>;
  showConfirm: (message: string | ReactNode, options?: Omit<DialogOptions, 'message' | 'type'>) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  
  // Use a ref to store the resolve function of the Promise
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((message: string | ReactNode, opts?: Omit<DialogOptions, 'message' | 'type'>) => {
    return new Promise<void>((resolve) => {
      setOptions({
        message,
        type: 'alert',
        title: opts?.title || 'Thông báo',
        confirmText: opts?.confirmText || 'Đóng',
        icon: opts?.icon || <AlertCircle className="w-6 h-6 text-indigo-500" />,
        ...opts,
      });
      setIsOpen(true);
      resolverRef.current = () => resolve();
    });
  }, []);

  const showConfirm = useCallback((message: string | ReactNode, opts?: Omit<DialogOptions, 'message' | 'type'>) => {
    return new Promise<boolean>((resolve) => {
      setOptions({
        message,
        type: 'confirm',
        title: opts?.title || 'Xác nhận',
        confirmText: opts?.confirmText || 'Đồng ý',
        cancelText: opts?.cancelText || 'Hủy',
        icon: opts?.icon || (opts?.destructive ? <AlertCircle className="w-6 h-6 text-rose-500" /> : <HelpCircle className="w-6 h-6 text-indigo-500" />),
        ...opts,
      });
      setIsOpen(true);
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={options.type === 'alert' ? handleConfirm : handleCancel}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-[400px] bg-card rounded-2xl shadow-xl overflow-hidden border border-[var(--border)]"
            >
              <div className="p-6">
                <div className="flex gap-4">
                  <div className={cn(
                    "shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                    options.destructive ? "bg-rose-100 dark:bg-rose-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"
                  )}>
                    {options.icon}
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {options.title}
                    </h3>
                    <div className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {options.message}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-[var(--border)] flex justify-end gap-3">
                {options.type === 'confirm' && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/70 bg-white dark:bg-slate-800 border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground transition-colors"
                  >
                    {options.cancelText}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm flex items-center gap-2",
                    options.destructive 
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                  )}
                >
                  {options.type === 'alert' ? <Check className="w-4 h-4" /> : null}
                  {options.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

