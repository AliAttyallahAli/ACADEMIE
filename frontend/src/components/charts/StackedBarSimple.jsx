import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function StackedBarSimple({ data, bars = [], labelKey = 'name', height = 280 }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-gray-400" style={{ height }}>Aucune donnée</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {bars.map((b) => (
          <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} stackId="a" fill={b.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
