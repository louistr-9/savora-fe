import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-50">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-card border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-muted/30">
                <h2 className="font-semibold text-lg text-foreground">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors dark:hover:bg-white/10 text-foreground/70">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto text-foreground">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

