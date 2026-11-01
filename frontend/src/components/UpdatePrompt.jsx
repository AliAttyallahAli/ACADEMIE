import { RefreshCw } from 'lucide-react';
import usePWA from '../hooks/usePWA';

export default function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 rounded-lg bg-alkher-600 p-3 text-white shadow-xl lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Mise à jour disponible</p>
        </div>
        <button
          onClick={applyUpdate}
          className="rounded bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}