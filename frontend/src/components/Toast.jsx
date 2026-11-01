import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const config = {
    success: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    error: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  };
  const { icon: Icon, bg, text, border } = config[type];

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md animate-in slide-in-from-top">
      <div className={`flex items-start gap-3 rounded-lg border ${border} ${bg} p-4 shadow-lg`}>
        <Icon className={`h-5 w-5 flex-shrink-0 ${text}`} />
        <p className={`flex-1 text-sm ${text}`}>{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}