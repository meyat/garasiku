"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Don't show again if the user already dismissed it this session, or the app
    // is already installed (running in standalone display mode).
    const alreadyDismissed = sessionStorage.getItem("garasiku-install-dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (alreadyDismissed || isStandalone) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferredPrompt) return null;

  async function handleInstall() {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  }

  function handleDismiss() {
    sessionStorage.setItem("garasiku-install-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 inset-x-4 md:bottom-4 md:right-4 md:left-auto md:max-w-xs z-20">
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <Download size={18} className="text-brand-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Pasang GarasiKu</p>
          <p className="text-xs text-neutral-500">Akses lebih cepat dari layar utama</p>
        </div>
        <button onClick={handleInstall} className="text-xs font-medium text-brand-600 px-2 py-1">
          Pasang
        </button>
        <button onClick={handleDismiss} className="text-neutral-400 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
