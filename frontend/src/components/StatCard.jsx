import { TrendingUp } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = 'alkher', subtitle }) {
  const colorMap = {
    alkher: 'bg-alkher-50 text-alkher-600',
    green: 'bg-green-50 text-green-600',
    gold: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card flex items-center gap-3 p-4">
      {Icon && (
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}