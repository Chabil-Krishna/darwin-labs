import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PROBLEMS,
  createRandomPopulation,
  evaluatePopulation,
  selectParent,
  selectParentWithDetails,
  tournamentSelectWithDetails,
  singlePointCrossover,
  singlePointCrossoverWithDetails,
  mutateChromosome,
  mutateChromosomeWithDetails,
  computeDiversity,
} from '../engine/ga';

// Phase order: idle → evaluate → select → crossover → mutate → replace → evaluate …
const PHASES = ['idle', 'evaluate', 'select', 'crossover', 'mutate', 'replace'];

export const SPEED_MAP = {
  5: 5000,
  6: 6000,
  7: 7000,
  8: 8000,
  9: 9000,
  10: 10000,
  1: 10000,
};

const getIntervalMs = (s) => (s >= 5 && s <= 10 ? s * 1000 : (SPEED_MAP[s] || 10000));

const initialState = {
  population: [],
  fitnesses: [],
  generation: 0,
  phase: 'idle',
  history: { best: [], avg: [], worst: [], diversity: [] },
  selected: [],       // Array of [parentIdxA, parentIdxB]
  selectedPool: [],   // Array of { spinNum, idx, r, cumProb, prob, total }
  selectionSpins: {}, // chrIdx -> [{ spinNum, r, cumProb, prob, total }]
  offspring: [],
  crossoverDetails: {}, // offspringIdx -> { parents: [pA, pB], sourceParent, r, cxRate, performed, cutPoint }
  crossoverPoints: [], // per offspring
  mutationDetails: {},  // offspringIdx -> { chr, bits, details: [...] }
  mutatedIndices: [],  // which offspring indices got mutated
  mutatedBitsMap: {},  // offspringIdx -> [bitPositions]
  genealogy: [],
  converged: false,
  stepLog: null,       // { icon, title, text, details }
};

export default function useGAEngine() {
  const [state, setState] = useState(initialState);
  const [params, setParams] = useState({
    problem: 'onemax',
    popSize: 8,
    chrLen: 8,
    cxRate: 0.8,
    mutRate: 0.05,
    selection: 'roulette',
    target: 'HELLO',
  });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // 10s default (ranges 10s to 5s)
  const [timeRemaining, setTimeRemaining] = useState(10000);
  const timerRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const getEffectiveChrLen = useCallback(() => {
    return params.problem === 'targetstr' ? params.target.length : params.chrLen;
  }, [params]);

  const def = PROBLEMS[params.problem];

  // ---- Record history ----
  const recordHistory = (pop, fits, history) => {
    if (fits.length === 0) return history;
    const best = Math.max(...fits);
    const avg = fits.reduce((a, b) => a + b, 0) / fits.length;
    const worst = Math.min(...fits);
    const diversity = computeDiversity(pop);
    return {
      best: [...history.best, best],
      avg: [...history.avg, avg],
      worst: [...history.worst, worst],
      diversity: [...history.diversity, diversity],
    };
  };

  // ---- Step ----
  const step = useCallback(() => {
    setState((prev) => {
      if (prev.converged) {
        return {
          ...prev,
          phase: 'converged',
          stepLog: {
            stepType: 'converged',
            title: 'Algorithm Converged',
            text: 'The optimal solution has already been achieved. Press <b>Reset</b> to run a new search or adjust parameters.',
            details: prev.stepLog?.details || '',
            phaseColor: 'orange',
          },
        };
      }

      const p = params;
      const chrLen = getEffectiveChrLen();
      const problemDef = PROBLEMS[p.problem];
      const target = p.target.split('');

      // === IDLE → Initialize ===
      if (prev.phase === 'idle') {
        const population = createRandomPopulation(p.problem, p.popSize, chrLen, target);

        return {
          ...initialState,
          population,
          fitnesses: [],
          history: { best: [], avg: [], worst: [], diversity: [] },
          phase: 'evaluate',
          stepLog: {
            stepType: 'init',
            title: 'Step 1: Initialization',
            text: `Created a random population of <b>${p.popSize}</b> chromosomes, each with <b>${chrLen}</b> genes. Each gene is randomly assigned. Chromosome fitness is not evaluated in this step; it will be evaluated next in Step 2: Fitness Evaluation.`,
            details: `Population size = ${p.popSize}\nChromosome length = ${chrLen}\nSearch space = ${problemDef.alleles.length}^${chrLen} = ${BigInt(problemDef.alleles.length) ** BigInt(chrLen)} possible solutions\n\nInitial Chromosomes (unrated):\n` +
              population.map((c, i) => `Chr ${i}: [${c.join('')}] → awaiting evaluation`).join('\n'),
            phaseColor: 'blue',
          },
        };
      }

      // === EVALUATE ===
      if (prev.phase === 'evaluate') {
        const fitnesses = evaluatePopulation(prev.population, p.problem, target);
        const maxF = Math.max(...fitnesses);
        const avgF = (fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length).toFixed(2);
        const converged = maxF >= problemDef.maxFitness(chrLen);
        const history = recordHistory(prev.population, fitnesses, prev.history);

        return {
          ...prev,
          fitnesses,
          history,
          selected: [],
          selectedPool: [],
          selectionSpins: {},
          mutatedIndices: [],
          mutatedBitsMap: {},
          mutationDetails: {},
          offspring: [],
          crossoverDetails: {},
          crossoverPoints: [],
          phase: converged ? 'converged' : 'select',
          converged,
          stepLog: {
            stepType: converged ? 'converged' : 'eval',
            title: converged ? 'Convergence Achieved: Optimal Solution Found' : 'Step 2: Fitness Evaluation',
            text: converged
              ? `Optimal chromosome found with maximum fitness of <b class="text-orange-600 font-bold">${maxF}</b>. The algorithm has successfully converged!`
              : `Each chromosome is scored by the fitness function. Best: <b class="text-orange-600 font-bold">${maxF}</b>, Average: <b>${avgF}</b>.`,
            details: prev.population
              .map((c, i) => `Chr ${i}: [${c.join('')}] → f(x) = ${fitnesses[i]}`)
              .join('\n'),
            phaseColor: 'emerald',
          },
        };
      }

      // === SELECT ===
      if (prev.phase === 'select') {
        const needed = p.popSize;
        const selectedPool = [];
        const selectionSpins = {};

        if (p.selection === 'tournament') {
          // Tournament Selection (Binary Tournament: k = 2)
          // Pick any 2 chromosomes, compare their fitness scores, select the one with greater fitness.
          // Repeat until the mating pool is filled up to population size.
          for (let round = 0; round < needed; round++) {
            const t = tournamentSelectWithDetails(prev.fitnesses, 2);
            const slotInfo = {
              slotNum: round + 1,
              spinNum: round + 1,
              idx: t.idx,
              competitors: t.competitors,
              competitorFitnesses: t.competitorFitnesses,
              method: 'tournament',
            };
            selectedPool.push(slotInfo);

            if (!selectionSpins[t.idx]) {
              selectionSpins[t.idx] = [];
            }
            selectionSpins[t.idx].push(slotInfo);
          }

          // Form parent pairs from the mating pool for crossover
          const selected = [];
          for (let i = 0; i < needed; i += 2) {
            const p1 = selectedPool[i].idx;
            const p2 = (i + 1 < needed) ? selectedPool[i + 1].idx : selectedPool[0].idx;
            selected.push([p1, p2]);
          }

          const matchLines = selectedPool.map((s) => {
            const c0 = s.competitors[0];
            const c1 = s.competitors[1];
            const f0 = s.competitorFitnesses[0];
            const f1 = s.competitorFitnesses[1];
            return `  Match #${s.slotNum}: Chr ${c0} (f(x)=${f0}) vs Chr ${c1} (f(x)=${f1}) → Winner: Chr ${s.idx}`;
          });

          const pairLines = selected.map((pair, i) => {
            return `  Pair ${i + 1}: Parent A (Chr ${pair[0]}) × Parent B (Chr ${pair[1]})`;
          });

          return {
            ...prev,
            selected,
            selectedPool,
            selectionSpins,
            phase: 'crossover',
            stepLog: {
              stepType: 'select',
              title: 'Step 3: Selection — Tournament Selection (k=2)',
              text: `For each of the <b>${needed}</b> mating pool slots, 2 chromosomes were randomly picked. The chromosome with the greater fitness score won each tournament and was placed into the mating pool. Formed <b>${selected.length}</b> parent pairs for crossover.`,
              details: [
                `Tournament Selection Rule: Randomly pick 2 chromosomes. Select the one with greater fitness score into the mating pool. Repeat ${needed} times to fill the pool.\n`,
                `Tournament Matches (${needed} matches):\n` + matchLines.join('\n'),
                `\nParent Pairs for Crossover:\n` + pairLines.join('\n'),
              ].join('\n'),
              phaseColor: 'amber',
            },
          };
        }

        // Roulette Wheel Selection (or Rank)
        const totalF = prev.fitnesses.reduce((a, b) => a + b, 0);
        let cumSum = 0;
        const probs = prev.fitnesses.map((f) => (totalF > 0 ? f / totalF : 0));
        const cumProbs = probs.map((prob) => {
          cumSum += prob;
          return cumSum;
        });
        if (cumProbs.length > 0) cumProbs[cumProbs.length - 1] = 1.0;

        for (let spin = 0; spin < needed; spin++) {
          const s = selectParentWithDetails(prev.fitnesses, p.selection);
          const spinInfo = {
            slotNum: spin + 1,
            spinNum: spin + 1,
            idx: s.idx,
            r: s.r,
            cumProb: s.cumProb,
            prob: s.prob,
            total: totalF,
            method: 'roulette',
          };
          selectedPool.push(spinInfo);

          if (!selectionSpins[s.idx]) {
            selectionSpins[s.idx] = [];
          }
          selectionSpins[s.idx].push(spinInfo);
        }

        const selected = [];
        for (let i = 0; i < needed; i += 2) {
          const p1 = selectedPool[i].idx;
          const p2 = (i + 1 < needed) ? selectedPool[i + 1].idx : selectedPool[0].idx;
          selected.push([p1, p2]);
        }

        const methodNames = { roulette: 'Roulette Wheel' };
        const selectionDesc = {
          roulette: `The roulette wheel is spun exactly <b>${needed}</b> times (equal to population size). Selected with replacement (cumulative probability q &ge; r), so the same chromosome can be selected again and again into the mating pool.`,
        };

        const tableLines = prev.population.map((c, i) => {
          const f = prev.fitnesses[i] ?? 0;
          const pVal = ((probs[i] || 0) * 100).toFixed(1);
          const qVal = ((cumProbs[i] || 0) * 100).toFixed(1);
          const times = selectionSpins[i]?.length || 0;
          return `  Chr ${i}: f(x) = ${f.toString().padEnd(4)} | p = ${pVal.padStart(5)}% | cum(q) = ${qVal.padStart(5)}% | selected ${times}×`;
        });

        const spinLines = selectedPool.map((s) => {
          const rStr = s.r !== null ? `(r = ${(s.r * 100).toFixed(1)}% ≤ cum ${(s.cumProb * 100).toFixed(1)}%)` : '';
          return `  Spin #${s.spinNum}: Chr ${s.idx} ${rStr}`;
        });

        const pairLines = selected.map((pair, i) => {
          return `  Pair ${i + 1}: Parent A (Chr ${pair[0]}) × Parent B (Chr ${pair[1]})`;
        });

        return {
          ...prev,
          selected,
          selectedPool,
          selectionSpins,
          phase: 'crossover',
          stepLog: {
            stepType: 'select',
            title: `Step 3: Selection — ${methodNames[p.selection] || 'Roulette Wheel'}`,
            text: (selectionDesc[p.selection] || selectionDesc.roulette) + ` Total population fitness Σf = <b>${totalF}</b>. Formed <b>${selected.length}</b> parent pairs for crossover.`,
            details: [
              `Total Population Fitness (Σf) = ${totalF}`,
              `Cumulative Probability Table:\n` + tableLines.join('\n'),
              `Roulette Wheel Spins (${needed} spins with replacement):\n` + spinLines.join('\n'),
              `Parent Pairs for Crossover:\n` + pairLines.join('\n'),
            ].join('\n\n'),
            phaseColor: 'amber',
          },
        };
      }

      // === CROSSOVER ===
      if (prev.phase === 'crossover') {
        const needed = p.popSize;
        const offspring = [];
        const crossoverPoints = [];
        const crossoverDetails = {};
        const genealogy = [...prev.genealogy];
        const pairLogs = [];

        for (let pairIdx = 0; pairIdx < prev.selected.length; pairIdx++) {
          const [pi1, pi2] = prev.selected[pairIdx];
          const cxRes = singlePointCrossoverWithDetails(
            prev.population[pi1],
            prev.population[pi2],
            p.cxRate
          );

          const rPct = (cxRes.r * 100).toFixed(1);
          const ratePct = (cxRes.cxRate * 100).toFixed(0);

          if (cxRes.performed) {
            pairLogs.push(
              `Pair ${pairIdx + 1} (P${pi1} × P${pi2}): r = ${rPct}% < ${ratePct}% → CROSSOVER at cut point ${cxRes.point}\n` +
              `  Parent ${pi1}: [${prev.population[pi1].join('')}]\n` +
              `  Parent ${pi2}: [${prev.population[pi2].join('')}]\n` +
              `  O${offspring.length}: [${cxRes.children[0].join('')}] (cut @${cxRes.point})\n` +
              (offspring.length + 1 < needed ? `  O${offspring.length + 1}: [${cxRes.children[1].join('')}] (cut @${cxRes.point})` : '')
            );
          } else {
            pairLogs.push(
              `Pair ${pairIdx + 1} (P${pi1} × P${pi2}): r = ${rPct}% ≥ ${ratePct}% → NO CROSSOVER (parents cloned directly)`
            );
          }

          // Offspring 1
          const offIdx1 = offspring.length;
          offspring.push(cxRes.children[0]);
          crossoverPoints.push(cxRes.performed ? cxRes.point : -1);
          crossoverDetails[offIdx1] = {
            parents: [pi1, pi2],
            sourceParent: pi1,
            r: cxRes.r,
            cxRate: cxRes.cxRate,
            performed: cxRes.performed,
            cutPoint: cxRes.performed ? cxRes.point : -1,
          };
          genealogy.push({ gen: prev.generation, parents: [pi1, pi2], childIdx: offIdx1 });

          // Offspring 2 if needed
          if (offspring.length < needed) {
            const offIdx2 = offspring.length;
            offspring.push(cxRes.children[1]);
            crossoverPoints.push(cxRes.performed ? cxRes.point : -1);
            crossoverDetails[offIdx2] = {
              parents: [pi1, pi2],
              sourceParent: pi2,
              r: cxRes.r,
              cxRate: cxRes.cxRate,
              performed: cxRes.performed,
              cutPoint: cxRes.performed ? cxRes.point : -1,
            };
            genealogy.push({ gen: prev.generation, parents: [pi1, pi2], childIdx: offIdx2 });
          }
        }

        const trimmed = offspring.slice(0, needed);
        const trimmedCp = crossoverPoints.slice(0, needed);
        const crossedCount = trimmedCp.filter((x) => x > 0).length;

        return {
          ...prev,
          offspring: trimmed,
          crossoverPoints: trimmedCp,
          crossoverDetails,
          genealogy,
          phase: 'mutate',
          stepLog: {
            stepType: 'cross',
            title: 'Step 4: Crossover (Single-Point)',
            text: `For each parent pair, a random number r in [0, 1) is rolled. Crossover occurs <b>only if r &lt; crossover rate (${(p.cxRate * 100).toFixed(0)}%)</b> at a random cut point; otherwise parents are cloned directly. <b>${crossedCount}</b> of <b>${trimmed.length}</b> offspring were produced by crossover.`,
            details: [
              `Crossover Rate (cxRate) = ${(p.cxRate * 100).toFixed(0)}%`,
              `Condition: Generate random r ∈ [0, 100%). If r < cxRate, pick random cut point k ∈ [1, L-1] and swap tails. Else, clone parents.\n`,
              pairLogs.join('\n\n'),
            ].join('\n'),
            phaseColor: 'pink',
          },
        };
      }

      // === MUTATE ===
      if (prev.phase === 'mutate') {
        const newOffspring = [...prev.offspring.map((c) => [...c])];
        const mutatedIndices = [];
        const mutatedBitsMap = {};
        const mutationDetails = {};
        let totalMutations = 0;
        const details = [];

        const mutRatePct = (p.mutRate * 100).toFixed(1);

        for (let i = 0; i < newOffspring.length; i++) {
          const before = [...newOffspring[i]];
          const result = mutateChromosomeWithDetails(newOffspring[i], p.mutRate, problemDef.alleles);
          newOffspring[i] = result.chr;
          mutationDetails[i] = result;

          if (result.bits.length > 0) {
            mutatedIndices.push(i);
            mutatedBitsMap[i] = result.bits;
            totalMutations += result.bits.length;
            const bitDescs = result.details
              .filter((d) => d.mutated)
              .map((d) => `pos ${d.pos}: r = ${(d.r * 100).toFixed(1)}% < ${mutRatePct}% (${d.before} → ${d.after})`)
              .join('; ');
            details.push(`Offspring O${i}: ${result.bits.length} mutation(s) [${bitDescs}]\n  Before: [${before.join('')}]\n  After:  [${result.chr.join('')}]`);
          } else {
            details.push(`Offspring O${i}: No mutation (all gene rolls r ≥ ${mutRatePct}%)\n  Unchanged: [${before.join('')}]`);
          }
        }

        return {
          ...prev,
          offspring: newOffspring,
          mutatedIndices,
          mutatedBitsMap,
          mutationDetails,
          phase: 'replace',
          stepLog: {
            stepType: 'mutate',
            title: 'Step 5: Mutation',
            text: `Each gene rolls a random number r in [0, 1). A gene mutates <b>only if r &lt; mutation rate (${mutRatePct}%)</b>. <b>${totalMutations}</b> total mutations occurred across <b>${mutatedIndices.length}</b> offspring.`,
            details: [
              `Mutation Rate (mutRate) = ${mutRatePct}% per gene`,
              `Condition: For each gene, roll r ∈ [0, 100%). If r < mutRate, flip/change allele. Else, keep existing allele.\n`,
              details.length > 0 ? details.join('\n\n') : 'No genes rolled r < mutRate. All genes remained unchanged this generation.',
            ].join('\n'),
            phaseColor: 'rose',
          },
        };
      }

      // === REPLACE ===
      if (prev.phase === 'replace') {
        const trimmedPop = [...prev.offspring].slice(0, p.popSize);
        const generation = prev.generation + 1;

        return {
          ...prev,
          population: trimmedPop,
          fitnesses: [],
          generation,
          selected: [],
          selectedPool: [],
          selectionSpins: {},
          offspring: [],
          crossoverDetails: {},
          crossoverPoints: [],
          mutationDetails: {},
          mutatedIndices: [],
          mutatedBitsMap: {},
          phase: 'evaluate',
          converged: false,
          stepLog: {
            stepType: 'replace',
            title: `Step 6: Replacement — Generation ${generation}!`,
            text: `The old population is replaced entirely by the <b>${prev.offspring.length}</b> new offspring to form Generation ${generation}. The new generation will be evaluated in the next step.`,
            details: `Generation ${generation}\nPopulation size: ${trimmedPop.length} candidate solutions.\n\nNew generation chromosomes:\n` +
              trimmedPop.map((c, i) => `Chr ${i}: [${c.join('')}] → awaiting evaluation`).join('\n'),
            phaseColor: 'violet',
          },
        };
      }

      return prev;
    });
  }, [params, getEffectiveChrLen]);

  // Reset countdown when speed changes or paused
  useEffect(() => {
    if (!playing) {
      setTimeRemaining(getIntervalMs(speed));
    }
  }, [speed, playing]);

  // ---- Play / Pause with 100ms countdown tick ----
  useEffect(() => {
    if (playing) {
      const intervalMs = getIntervalMs(speed);
      const tickMs = 100;
      let currentLeft = intervalMs;
      setTimeRemaining(intervalMs);

      timerRef.current = setInterval(() => {
        currentLeft -= tickMs;
        if (currentLeft <= 0) {
          currentLeft = intervalMs;
          setTimeRemaining(intervalMs);
          step();
        } else {
          setTimeRemaining(currentLeft);
        }
      }, tickMs);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, speed, step]);

  // Auto-pause on convergence
  useEffect(() => {
    if (state.converged) setPlaying(false);
  }, [state.converged]);

  const play = useCallback(() => {
    // If at the beginning of the pipeline (idle), fire the first step immediately
    if (stateRef.current.phase === 'idle' && !stateRef.current.converged) {
      step();
    }
    setPlaying(true);
  }, [step]);
  const pause = useCallback(() => setPlaying(false), []);

  const reset = useCallback(() => {
    setPlaying(false);
    setState(initialState);
    setTimeRemaining(getIntervalMs(speed));
  }, [speed]);

  const updateParams = useCallback(
    (updates) => {
      setPlaying(false);
      setParams((prev) => ({ ...prev, ...updates }));
      setState(initialState);
      setTimeRemaining(getIntervalMs(speed));
    },
    [speed]
  );

  return {
    state,
    params,
    playing,
    speed,
    setSpeed,
    timeRemaining,
    totalTime: getIntervalMs(speed),
    step,
    play,
    pause,
    reset,
    updateParams,
    getEffectiveChrLen,
  };
}
