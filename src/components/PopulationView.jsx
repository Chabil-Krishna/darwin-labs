import { PROBLEMS } from '../engine/ga';
import { motion, AnimatePresence } from 'framer-motion';
import InfoTooltip from './InfoTooltip';

export default function PopulationView({ state, params }) {
  const def = PROBLEMS[params.problem];
  const chrLen = params.problem === 'targetstr' ? params.target.length : params.chrLen;
  const target = params.target.split('');
  const showOffspring = state.offspring.length > 0;
  const totalFitness = (state.fitnesses || []).reduce((sum, f) => sum + (f || 0), 0);

  if (state.population.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 text-sm">
        Press <b className="mx-1 text-orange-600">Step</b> or <b className="mx-1 text-orange-500">Play</b> to begin
      </div>
    );
  }

  return (
    <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1">
      {/* Header & Legend */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-stone-600 mb-2.5 pb-2.5 border-b border-orange-100 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-orange-950">
          <span>Chromosome Population</span>
          <InfoTooltip
            title="Population Column"
            text="Displays every chromosome in the current generation with gene-level breakdown, fitness scores, selection status (parents), crossover points, and mutations."
            align="left"
            position="bottom"
          />
          {totalFitness > 0 && (
            <span className="ml-1.5 font-mono text-[10px] font-normal text-stone-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              Total Fitness Σf = <b className="text-orange-950">{totalFitness}</b>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Selected Parent</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Offspring</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mutated</span>
        </div>
      </div>

      {/* Current Population */}
      <AnimatePresence mode="popLayout">
        {state.population.map((chr, i) => {
          const isSelected = state.selected.flat().includes(i);
          const fit = state.fitnesses[i] ?? 0;
          const prob = totalFitness > 0 ? (fit / totalFitness) : 0;
          const probPercent = (prob * 100).toFixed(1);

          let rowStyle = 'bg-orange-50/30 hover:bg-orange-50/70 border border-transparent';
          let badge = null;
          if (isSelected) {
            rowStyle = 'bg-amber-50 border border-amber-300';
            badge = <Badge label="Parent" isParent />;
          }

          return (
            <motion.div
              key={`pop-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: showOffspring ? 0.45 : 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${rowStyle}`}
            >
              <span className="text-[11px] text-stone-500 font-mono w-5 text-right shrink-0">{i}</span>
              <ChromosomeDisplay chr={chr} problem={params.problem} target={target} />
              {params.problem === 'funcmax' && (
                <span className="text-[11px] text-orange-700 font-mono font-medium shrink-0">
                  x={parseInt(chr.join(''), 2)}
                </span>
              )}
              <span className="font-mono text-xs font-bold text-stone-800 shrink-0 whitespace-nowrap min-w-[68px] text-right">
                <span className="text-orange-700 font-sans font-medium text-[11px] mr-1">f(x) =</span>
                <span>{state.fitnesses[i] !== undefined ? state.fitnesses[i] : '—'}</span>
              </span>
              <FitnessBar value={state.fitnesses[i]} max={def.maxFitness(chrLen)} />
              {badge}
              {isSelected && totalFitness > 0 && (
                <span
                  title={`Roulette Wheel Selection Probability: p = f_i / Σf = ${fit} / ${totalFitness} = ${(prob * 100).toFixed(2)}%`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-100 text-amber-950 border border-amber-300 shrink-0 font-medium cursor-help"
                >
                  <span className="text-amber-700 font-sans font-semibold">p =</span>
                  <span className="font-semibold">{fit}/{totalFitness}</span>
                  <span className="font-bold text-orange-700">({probPercent}%)</span>
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Offspring */}
      {showOffspring && (
        <>
          <div className="text-xs font-bold text-orange-700 mt-4 mb-2 pb-1.5 border-b border-orange-200 flex items-center gap-1.5">
            <span className="text-sm">↓</span> Offspring (Next Generation Candidate Pool)
          </div>
          <AnimatePresence mode="popLayout">
            {state.offspring.map((chr, i) => {
              const isMutated = state.mutatedIndices.includes(i);
              const cp = state.crossoverPoints[i];
              const mutBits = state.mutatedBitsMap?.[i] || [];

              let rowStyle = 'bg-orange-50/60 border border-orange-200';
              let badge = null;
              if (isMutated) {
                rowStyle = 'bg-orange-100 border border-orange-400';
                badge = <Badge label="Mutated" isMutated />;
              }

              const fitness = params.problem === 'targetstr'
                ? def.fitness(chr, target)
                : def.fitness(chr);

              return (
                <motion.div
                  key={`off-${i}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${rowStyle}`}
                >
                  <span className="text-[11px] text-stone-500 font-mono w-5 text-right shrink-0">O{i}</span>
                  <ChromosomeDisplay chr={chr} problem={params.problem} target={target} crossoverPoint={cp} mutatedBits={mutBits} />
                  <span className="font-mono text-xs font-bold text-stone-800 shrink-0 whitespace-nowrap min-w-[68px] text-right">
                    <span className="text-orange-700 font-sans font-medium text-[11px] mr-1">f(x) =</span>
                    <span>{fitness}</span>
                  </span>
                  <FitnessBar value={fitness} max={def.maxFitness(chrLen)} />
                  {cp > 0 && (
                    <span className="text-[10px] text-orange-600 font-bold shrink-0">cut @{cp}</span>
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

// ---- Gene display in White & Orange ----
function ChromosomeDisplay({ chr, problem, target, crossoverPoint, mutatedBits = [] }) {
  return (
    <div className="inline-flex gap-px rounded overflow-hidden shrink-0 shadow-2xs">
      {chr.map((gene, i) => {
        let bg, textColor;

        if (problem === 'targetstr') {
          const match = target && i < target.length && gene === target[i];
          bg = match ? 'bg-orange-500' : 'bg-orange-100/70';
          textColor = match ? 'text-white' : 'text-orange-950/60';
        } else {
          bg = gene === '1' ? 'bg-orange-500' : 'bg-orange-100/70';
          textColor = gene === '1' ? 'text-white' : 'text-orange-950/60';
        }

        let ring = '';
        if (crossoverPoint !== undefined && crossoverPoint > 0 && i === crossoverPoint) {
          ring = 'ring-2 ring-orange-700 z-10';
        }
        if (mutatedBits.includes(i)) {
          ring = 'ring-2 ring-orange-600 z-10';
          bg = 'bg-orange-400';
          textColor = 'text-white';
        }

        const size = chr.length > 10 ? 'w-[18px] h-[22px] text-[9px]' : 'w-[22px] h-[24px] text-[11px]';

        return (
          <span
            key={i}
            className={`${size} flex items-center justify-center font-mono font-bold ${bg} ${textColor} ${ring} transition-all`}
          >
            {gene}
          </span>
        );
      })}
    </div>
  );
}

function FitnessBar({ value, max }) {
  if (value === undefined || value === null) {
    return (
      <div className="w-16 h-1.5 rounded-full bg-orange-100/60 border border-orange-200/50 overflow-hidden shrink-0" />
    );
  }
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-16 h-1.5 rounded-full bg-orange-100 border border-orange-200 overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Badge({ label, isParent, isMutated }) {
  let cls = 'bg-orange-100 text-orange-900 border border-orange-300';
  if (isParent) cls = 'bg-amber-100 text-orange-900 border border-amber-300 font-bold';
  if (isMutated) cls = 'bg-orange-200 text-orange-950 border border-orange-500 font-bold';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${cls} shrink-0`}>
      {label}
    </span>
  );
}
