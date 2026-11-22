import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PROBLEMS,
  createRandomPopulation,
  evaluatePopulation,
  selectParent,
  singlePointCrossover,
  mutateChromosome,
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
  offspring: [],
  mutatedIndices: [],  // which offspring indices got mutated
  mutatedBitsMap: {},  // offspringIdx -> [bitPositions]
  crossoverPoints: [], // per offspring
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
        const fitnesses = evaluatePopulation(population, p.problem, target);
        const history = recordHistory(population, fitnesses, { best: [], avg: [], worst: [], diversity: [] });

        return {
          ...initialState,
          population,
          fitnesses,
          history,
          phase: 'evaluate',
          stepLog: {
            stepType: 'init',
            title: 'Step 1: Initialization',
            text: `Created a random population of <b>${p.popSize}</b> chromosomes, each with <b>${chrLen}</b> genes. Each gene is randomly assigned. This is our starting "gene pool" — the raw material evolution will work with.`,
            details: `Population size = ${p.popSize}\nChromosome length = ${chrLen}\nSearch space = ${problemDef.alleles.length}^${chrLen} = ${BigInt(problemDef.alleles.length) ** BigInt(chrLen)} possible solutions`,
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

        return {
          ...prev,
          fitnesses,
          selected: [],
          mutatedIndices: [],
          mutatedBitsMap: {},
          offspring: [],
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
              .map((c, i) => `Chr ${i}: [${c.join('')}] → fitness = ${fitnesses[i]}`)
              .join('\n'),
            phaseColor: 'emerald',
          },
        };
      }

      // === SELECT ===
      if (prev.phase === 'select') {
        const needed = p.popSize;
        const parentPairs = Math.ceil(needed / 2);
        const selected = [];

        for (let i = 0; i < parentPairs; i++) {
          const p1 = selectParent(prev.fitnesses, p.selection);
          let p2 = selectParent(prev.fitnesses, p.selection);
          let tries = 0;
          while (p2 === p1 && tries < 10) {
            p2 = selectParent(prev.fitnesses, p.selection);
            tries++;
          }
          selected.push([p1, p2]);
        }

        const methodNames = { roulette: 'Roulette Wheel', tournament: 'Tournament (k=3)', rank: 'Rank-Based' };
        const selectionDesc = {
          roulette: 'Each chromosome gets a "roulette wheel" slice proportional to its fitness. Fitter individuals have bigger slices and are more likely to be chosen as parents.',
          tournament: 'We randomly pick 3 individuals and the fittest one wins. This provides good selective pressure without computing total fitness.',
          rank: 'Chromosomes are ranked by fitness (1=worst, N=best). Selection probability is proportional to rank, preventing dominance by a single super-fit individual.',
        };

        return {
          ...prev,
          selected,
          phase: 'crossover',
          stepLog: {
            stepType: 'select',
            title: `Step 3: Selection — ${methodNames[p.selection]}`,
            text: selectionDesc[p.selection] + ` Selected <b>${parentPairs}</b> parent pairs for mating.`,
            details: selected
              .map((pair, i) => `Pair ${i + 1}: Parent A = Chr ${pair[0]} (fit=${prev.fitnesses[pair[0]]}), Parent B = Chr ${pair[1]} (fit=${prev.fitnesses[pair[1]]})`)
              .join('\n'),
            phaseColor: 'amber',
          },
        };
      }

      // === CROSSOVER ===
      if (prev.phase === 'crossover') {
        const needed = p.popSize;
        const offspring = [];
        const crossoverPoints = [];
        const genealogy = [...prev.genealogy];

        for (const [pi1, pi2] of prev.selected) {
          if (Math.random() < p.cxRate) {
            const { children, point } = singlePointCrossover(prev.population[pi1], prev.population[pi2]);
            offspring.push(children[0]);
            crossoverPoints.push(point);
            genealogy.push({ gen: prev.generation, parents: [pi1, pi2], childIdx: offspring.length - 1 });
            if (offspring.length < needed) {
              offspring.push(children[1]);
              crossoverPoints.push(point);
              genealogy.push({ gen: prev.generation, parents: [pi1, pi2], childIdx: offspring.length - 1 });
            }
          } else {
            offspring.push([...prev.population[pi1]]);
            crossoverPoints.push(-1);
            if (offspring.length < needed) {
              offspring.push([...prev.population[pi2]]);
              crossoverPoints.push(-1);
            }
          }
        }

        const trimmed = offspring.slice(0, needed);
        const trimmedCp = crossoverPoints.slice(0, needed);
        const crossedCount = trimmedCp.filter((x) => x > 0).length;

        return {
          ...prev,
          offspring: trimmed,
          crossoverPoints: trimmedCp,
          genealogy,
          phase: 'mutate',
          stepLog: {
            stepType: 'cross',
            title: 'Step 4: Crossover (Single-Point)',
            text: `Parent pairs exchange genetic material at a random crossover point. With rate <b>${p.cxRate}</b>, <b>${crossedCount}</b> of <b>${trimmed.length}</b> offspring were created by crossover. Genes before the point come from one parent, after from the other.`,
            details: prev.selected
              .map((pair, i) => {
                const pt = trimmedCp[i * 2] ?? trimmedCp[i];
                if (!pt || pt < 0) return `Pair ${i + 1}: No crossover (cloned parents)`;
                return `Pair ${i + 1}: Crossover at position ${pt}\n  P1: [${prev.population[pair[0]].join('')}]\n  P2: [${prev.population[pair[1]].join('')}]\n  C:  [${trimmed[i * 2]?.join('') ?? '—'}]`;
              })
              .join('\n\n'),
            phaseColor: 'pink',
          },
        };
      }

      // === MUTATE ===
      if (prev.phase === 'mutate') {
        const newOffspring = [...prev.offspring.map((c) => [...c])];
        const mutatedIndices = [];
        const mutatedBitsMap = {};
        let totalMutations = 0;
        const details = [];

        for (let i = 0; i < newOffspring.length; i++) {
          const before = [...newOffspring[i]];
          const result = mutateChromosome(newOffspring[i], p.mutRate, problemDef.alleles);
          newOffspring[i] = result.chr;
          if (result.bits.length > 0) {
            mutatedIndices.push(i);
            mutatedBitsMap[i] = result.bits;
            totalMutations += result.bits.length;
            details.push(`Offspring ${i}: mutated at pos ${result.bits.join(', ')}\n  Before: [${before.join('')}]\n  After:  [${result.chr.join('')}]`);
          }
        }

        return {
          ...prev,
          offspring: newOffspring,
          mutatedIndices,
          mutatedBitsMap,
          phase: 'replace',
          stepLog: {
            stepType: 'mutate',
            title: 'Step 5: Mutation',
            text: `Each gene has a <b>${(p.mutRate * 100).toFixed(0)}%</b> chance of flipping. <b>${totalMutations}</b> total mutations in <b>${mutatedIndices.length}</b> offspring. Mutation maintains genetic diversity and explores new areas of the search space.`,
            details: details.length > 0 ? details.join('\n\n') : 'No mutations occurred this generation.',
            phaseColor: 'rose',
          },
        };
      }

      // === REPLACE ===
      if (prev.phase === 'replace') {
        const trimmedPop = [...prev.offspring].slice(0, p.popSize);
        const fitnesses = evaluatePopulation(trimmedPop, p.problem, target);
        const generation = prev.generation + 1;
        const history = recordHistory(trimmedPop, fitnesses, prev.history);
        const maxF = Math.max(...fitnesses);
        const converged = maxF >= problemDef.maxFitness(chrLen);

        return {
          ...prev,
          population: trimmedPop,
          fitnesses,
          generation,
          history,
          selected: [],
          offspring: [],
          mutatedIndices: [],
          mutatedBitsMap: {},
          crossoverPoints: [],
          phase: converged ? 'converged' : 'evaluate',
          converged,
          stepLog: {
            stepType: converged ? 'converged' : 'replace',
            title: converged ? `Convergence Achieved — Generation ${generation}` : `Step 6: Replacement — Generation ${generation}!`,
            text: converged
              ? `The new generation produced the optimal solution with maximum fitness <b class="text-orange-600 font-bold">${maxF}</b>! The algorithm has fully converged.`
              : `The old population is replaced entirely by the <b>${prev.offspring.length}</b> new offspring. The cycle continues: Evaluate → Select → Crossover → Mutate → Replace.`,
            details: `Generation ${generation}\nBest fitness: ${maxF}\nBest: [${trimmedPop[fitnesses.indexOf(maxF)].join('')}]`,
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
