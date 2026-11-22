import { Dna, FlaskConical, Sparkles } from 'lucide-react';

const PHASE_STYLES = {
  idle: { label: 'Ready', bg: 'bg-dna-emerald/20', text: 'text-dna-emerald' },
  evaluate: { label: 'Evaluating', bg: 'bg-dna-green/20', text: 'text-dna-green' },
  select: { label: 'Selecting', bg: 'bg-dna-amber/20', text: 'text-dna-amber' },
  crossover: { label: 'Crossover', bg: 'bg-dna-pink/20', text: 'text-dna-pink' },
  mutate: { label: 'Mutating', bg: 'bg-dna-rose/20', text: 'text-dna-rose' },
  replace: { label: 'Replacing', bg: 'bg-dna-violet/20', text: 'text-dna-violet' },
};

export default function Header({ generation, phase }) {
  const ps = PHASE_STYLES[phase] || PHASE_STYLES.idle;

  return (
    <header className="border-b border-border bg-gradient-to-r from-surface-800 via-surface-900 to-surface-800">
      <div className="max-w-[1700px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dna-indigo to-dna-cyan flex items-center justify-center shadow-lg shadow-dna-indigo/20">
            <Dna size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Darwin Labs
              <Sparkles size={16} className="text-dna-amber" />
            </h1>
            <p className="text-xs text-text-muted font-medium">
              Interactive Genetic Algorithm Visualizer
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-dna-blue/20 text-dna-blue">
            <FlaskConical size={12} />
            Gen {generation}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ps.bg} ${ps.text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {ps.label}
          </span>
        </div>
      </div>
    </header>
  );
}
