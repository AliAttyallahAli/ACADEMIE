import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import usePWA from '../hooks/usePWA';

export default function InstallBanner() {
  const { canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('alkher-install-dismissed') === '1'
  );

  if (!canInstall || dismissed) return null;

  async function handleInstall() {
    const installed = await promptInstall();
    if (!installed) {
      localStorage.setItem('alkher-install-dismissed', '1');
      setDismissed(true);
    }
  }

  function handleDismiss() {
    localStorage.setItem('alkher-install-dismissed', '1');
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 rounded-lg border border-alkher-200 bg-white p-4 shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-alkher-100 p-2">
          <Smartphone className="h-5 w-5 text-alkher-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Installer ALKHER ACADEMY</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Accès rapide depuis l'écran d'accueil
          </p>
          <button onClick={handleInstall} className="btn-primary mt-2 text-xs">
            <Download className="mr-1 h-3 w-3" /> Installer
          </button>
        </div>
      </div>
    </div>
  );
}