import { useMemo } from 'react';
import InfoTooltip from './InfoTooltip';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 text-xs font-medium pt-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="w-6 h-0.5 bg-[#ea580c] inline-block rounded-full" />
        <span className="text-stone-800 font-semibold">Best</span>
        <span className="text-[10px] text-stone-500 font-mono">(Solid)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-[#d97706] inline-block" />
        <span className="text-stone-800 font-semibold">Average</span>
        <span className="text-[10px] text-stone-500 font-mono">(Dashed)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dotted border-[#78716c] inline-block" />
        <span className="text-stone-800 font-semibold">Worst</span>
        <span className="text-[10px] text-stone-500 font-mono">(Dotted)</span>
      </div>
    </div>
  );
}

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
      <div className="flex items-center justify-center h-80 text-stone-500 text-sm">
        No data yet — step through a few generations
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-stone-600 pb-2 border-b border-orange-100">
        <span className="font-semibold text-orange-950 flex items-center gap-1.5">
          Fitness Trajectory (Best, Average, Worst)
          <InfoTooltip
            title="Fitness Column"
            text="Plots Best, Average, and Worst fitness across generations to track convergence, evolutionary fitness gain, and population progress."
            align="left"
            position="bottom"
          />
        </span>
        <span className="text-[11px] text-stone-500 font-mono">Total Gens: {data.length}</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
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
              stroke="#ea580c"
              tick={{ fontSize: 11, fill: '#78716c' }}
              label={{ value: 'Fitness', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#9a3412', fontSize: 12 } }}
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
              formatter={(value, name) => [
                value,
                name === 'Best' ? 'Best (Solid)' : name === 'Average' ? 'Average (Dashed)' : 'Worst (Dotted)',
              ]}
            />
            <Legend content={<CustomLegend />} />
            <Area
              type="monotone"
              dataKey="Best"
              stroke="#ea580c"
              strokeWidth={2.5}
              fill="url(#bestGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Average"
              stroke="#d97706"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#avgGrad)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Worst"
              stroke="#78716c"
              strokeWidth={1.5}
              strokeDasharray="2 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
