export default function ProgressBar({ value = 0, max = 100, size = 'md', color = 'alkher' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const colors = {
    alkher: 'bg-alkher-500',
    green: 'bg-green-500',
    gold: 'bg-gold-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full overflow-hidden rounded-full bg-gray-200 ${heights[size]}`}>
      <div
        className={`${heights[size]} ${colors[color]} rounded-full transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}