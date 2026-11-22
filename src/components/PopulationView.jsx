import { PROBLEMS } from '../engine/ga';
import { motion, AnimatePresence } from 'framer-motion';

export default function PopulationView({ state, params }) {
  const def = PROBLEMS[params.problem];
  const chrLen = params.problem === 'targetstr' ? params.target.length : params.chrLen;
  const target = params.target.split('');
  const showOffspring = state.offspring.length > 0;

  if (state.population.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        Press <b className="mx-1 text-dna-blue">Step</b> or <b className="mx-1 text-dna-green">Play</b> to begin
      </div>
    );
  }

  return (
    <div className="max-h-[460px] overflow-y-auto space-y-1 pr-1">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-text-muted mb-2 pb-2 border-b border-border flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-dna-violet" /> Elite</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-dna-amber" /> Selected Parent</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-dna-green" /> Offspring</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-dna-rose" /> Mutated</span>
      </div>

      {/* Current Population */}
      <AnimatePresence mode="popLayout">
        {state.population.map((chr, i) => {
          const isElite = state.eliteIndices.includes(i);
          const isSelected = state.selected.flat().includes(i);

          let rowStyle = 'bg-surface-700/30';
          let badge = null;
          if (isElite) {
            rowStyle = 'bg-dna-violet/10 ring-1 ring-dna-violet/30';
            badge = <Badge color="dna-violet" label="★ Elite" />;
          } else if (isSelected) {
            rowStyle = 'bg-dna-amber/10 ring-1 ring-dna-amber/30';
            badge = <Badge color="dna-amber" label="⟡ Parent" />;
          }

          return (
            <motion.div
              key={`pop-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: showOffspring ? 0.4 : 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${rowStyle}`}
            >
              <span className="text-[11px] text-text-muted font-mono w-5 text-right shrink-0">{i}</span>
              <ChromosomeDisplay chr={chr} problem={params.problem} target={target} />
              {params.problem === 'funcmax' && (
                <span className="text-[11px] text-dna-cyan font-mono shrink-0">
                  x={parseInt(chr.join(''), 2)}
                </span>
              )}
              <span className="font-mono text-xs font-bold min-w-[36px] text-right shrink-0">
                {state.fitnesses[i] ?? '?'}
              </span>
              <FitnessBar value={state.fitnesses[i]} max={def.maxFitness(chrLen)} />
              {badge}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Offspring */}
      {showOffspring && (
        <>
          <div className="text-xs font-bold text-dna-green mt-3 mb-1 pb-1 border-b border-dna-green/20 flex items-center gap-1">
            <span className="text-sm">↓</span> Offspring
          </div>
          <AnimatePresence mode="popLayout">
            {state.offspring.map((chr, i) => {
              const isMutated = state.mutatedIndices.includes(i);
              const cp = state.crossoverPoints[i];
              const mutBits = state.mutatedBitsMap?.[i] || [];

              let rowStyle = 'bg-dna-green/10 ring-1 ring-dna-green/20';
              let badge = null;
              if (isMutated) {
                rowStyle = 'bg-dna-rose/10 ring-1 ring-dna-rose/30';
                badge = <Badge color="dna-rose" label="⚡ Mutated" />;
              }

              const fitness = params.problem === 'targetstr'
                ? def.fitness(chr, target)
                : def.fitness(chr);

              return (
                <motion.div
                  key={`off-${i}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${rowStyle}`}
                >
                  <span className="text-[11px] text-text-muted font-mono w-5 text-right shrink-0">O{i}</span>
                  <ChromosomeDisplay chr={chr} problem={params.problem} target={target} crossoverPoint={cp} mutatedBits={mutBits} />
                  <span className="font-mono text-xs font-bold min-w-[36px] text-right shrink-0">{fitness}</span>
                  <FitnessBar value={fitness} max={def.maxFitness(chrLen)} />
                  {cp > 0 && (
                    <span className="text-[10px] text-dna-pink font-semibold shrink-0">✂ @{cp}</span>
                  )}
                  {badge}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ---- Gene display ----
function ChromosomeDisplay({ chr, problem, target, crossoverPoint, mutatedBits = [] }) {
  return (
    <div className="inline-flex gap-px rounded overflow-hidden shrink-0">
      {chr.map((gene, i) => {
        let bg, textColor;

        if (problem === 'targetstr') {
          const match = target && i < target.length && gene === target[i];
          bg = match ? 'bg-dna-green' : 'bg-dna-rose/20';
          textColor = match ? 'text-white' : 'text-text-muted';
        } else {
          bg = gene === '1' ? (problem === 'funcmax' ? 'bg-dna-blue' : 'bg-dna-green') : 'bg-surface-500';
          textColor = gene === '1' ? 'text-white' : 'text-text-muted';
        }

        let ring = '';
        if (crossoverPoint !== undefined && crossoverPoint > 0 && i === crossoverPoint) {
          ring = 'ring-2 ring-dna-pink';
        }
        if (mutatedBits.includes(i)) {
          ring = 'ring-2 ring-dna-rose';
          bg = 'bg-dna-rose/40';
        }

        const size = chr.length > 10 ? 'w-[18px] h-[22px] text-[9px]' : 'w-[22px] h-[24px] text-[11px]';

        return (
          <span
            key={i}
            className={`${size} flex items-center justify-center font-mono font-bold ${bg} ${textColor} ${ring}`}
          >
            {gene}
          </span>
        );
      })}
    </div>
  );
}

function FitnessBar({ value, max }) {
  if (value === undefined || value === null) return null;
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-16 h-1.5 rounded-full bg-surface-500 overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-dna-green transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const BADGE_COLOR_MAP = {
  'dna-violet': 'bg-dna-violet/20 text-dna-violet',
  'dna-amber': 'bg-dna-amber/20 text-dna-amber',
  'dna-rose': 'bg-dna-rose/20 text-dna-rose',
};

function Badge({ color, label }) {
  const cls = BADGE_COLOR_MAP[color] || 'bg-surface-600 text-text-muted';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls} shrink-0`}>
      {label}
    </span>
  );
}
