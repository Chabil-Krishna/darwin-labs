import { useMemo } from 'react';
import InfoTooltip from './InfoTooltip';
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
      <div className="flex items-center justify-center h-56 text-stone-500 text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-3">
        <span>Genetic diversity (% of unique chromosomes). Watch it decrease as the population converges.</span>
        <InfoTooltip
          title="Diversity Column"
          text="Monitors the percentage of unique chromosomes in the population over time to diagnose premature convergence and balance exploration vs. exploitation."
          align="left"
          position="bottom"
        />
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
            <XAxis
              dataKey="gen"
              stroke="#ea580c"
              tick={{ fontSize: 11, fill: '#78716c' }}
              label={{ value: 'Generation', position: 'insideBottomRight', offset: -5, style: { fill: '#9a3412', fontSize: 12 } }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#ea580c"
              tick={{ fontSize: 11, fill: '#78716c' }}
              label={{ value: 'Diversity %', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#9a3412', fontSize: 12 } }}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #fb923c',
                borderRadius: 8,
                fontSize: 12,
                color: '#1c1917',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.15)',
              }}
            />
            <Area type="monotone" dataKey="Diversity" stroke="#ea580c" strokeWidth={2} fill="url(#divGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
