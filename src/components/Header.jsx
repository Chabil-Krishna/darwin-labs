import { Dna, FlaskConical } from 'lucide-react';

const PHASE_STYLES = {
  idle: { label: 'Ready', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  evaluate: { label: 'Evaluating', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  select: { label: 'Selecting', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  crossover: { label: 'Crossover', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  mutate: { label: 'Mutating', bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' },
  replace: { label: 'Replacing', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
};

export default function Header({ generation, phase }) {
  const ps = PHASE_STYLES[phase] || PHASE_STYLES.idle;

  return (
    <header className="border-b border-orange-200 bg-white shadow-sm shadow-orange-100/50 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
            <Dna size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
              Darwin Labs
            </h1>
            <p className="text-xs text-orange-800/80 font-medium">
              Interactive Genetic Algorithm Visualizer
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <FlaskConical size={12} className="text-orange-500" />
            Gen {generation}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ps.bg} ${ps.text} ${ps.border}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {ps.label}
          </span>
        </div>
      </div>
    </header>
  );
}
