'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export default function InstallPWA() {
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isAppInstalled);
    
    if (isAppInstalled) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS, we don't get a prompt event, so we show the modal proactively or via a button
    // (Here we show it proactively once per session, or you can bind it to a button)
    if (isIosDevice) {
      // Do nothing proactively. Wait for the user to click the install button.
    }

    // Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleShowPrompt = () => {
      if (!isAppInstalled) {
        setShowModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('show-install-prompt', handleShowPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-prompt', handleShowPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#2D2A26] dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 pb-4">
          <button 
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold text-white mb-2">Cài đặt ứng dụng Savora</h3>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            Thêm Savora vào màn hình chính để mở nhanh như một ứng dụng độc lập.
          </p>

          {!isIOS && deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-[#EFE9DD] hover:bg-white text-[#2D2A26] font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors mb-4"
            >
              <Download className="w-5 h-5" />
              Cài đặt ngay
            </button>
          )}

          {/* iOS Instructions */}
          {(isIOS || !deferredPrompt) && (
            <div className="space-y-4 mb-4">
              <p className="text-sm text-white/70 mb-4">Làm theo các bước sau:</p>
              
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#B67A18] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  Mở menu trình duyệt 
                  <div className="p-1 bg-white/10 rounded-md shrink-0">
                    {isIOS ? <Share className="w-4 h-4" /> : '⋮'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#B67A18] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  Chọn "Thêm vào MH chính"
                  <div className="p-1 bg-white/10 rounded-md shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#B67A18] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div className="text-sm text-white font-medium">
                  Xác nhận để cài đặt
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex justify-end">
          <button 
            onClick={() => setShowModal(false)}
            className="px-6 py-2.5 bg-[#B67A18] hover:bg-[#C98A20] text-white font-bold rounded-xl transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
