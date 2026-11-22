import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DiversityChart({ history }) {
  const data = useMemo(() => {
    return history.diversity.map((d, i) => ({
      gen: i,
      Diversity: parseFloat((d * 100).toFixed(1)),
    }));
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-text-muted text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-muted mb-3">
        Genetic diversity (% of unique chromosomes). Watch it decrease as the population converges.
        Too little diversity = premature convergence. Mutation helps maintain diversity.
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="gen" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }}
              label={{ value: 'Generation', position: 'insideBottomRight', offset: -5, style: { fill: '#64748b', fontSize: 12 } }} />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }}
              label={{ value: 'Diversity %', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#64748b', fontSize: 12 } }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="Diversity" stroke="#06b6d4" strokeWidth={2} fill="url(#divGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
