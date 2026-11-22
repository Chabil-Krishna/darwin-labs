import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';

export default function FitnessChart({ history }) {
  const data = useMemo(() => {
    return history.best.map((_, i) => ({
      gen: i,
      Best: history.best[i],
      Average: parseFloat(history.avg[i].toFixed(2)),
      Worst: history.worst[i],
    }));
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-text-muted text-sm">
        No data yet — step through a few generations
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <defs>
            <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="gen"
            stroke="#64748b"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Generation', position: 'insideBottomRight', offset: -5, style: { fill: '#64748b', fontSize: 12 } }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Fitness', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#64748b', fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
              color: '#e2e8f0',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area type="monotone" dataKey="Best" stroke="#22c55e" strokeWidth={2.5} fill="url(#bestGrad)" dot={false} />
          <Area type="monotone" dataKey="Average" stroke="#f59e0b" strokeWidth={2} fill="url(#avgGrad)" dot={false} />
          <Line type="monotone" dataKey="Worst" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
