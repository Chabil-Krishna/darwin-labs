// ============================================================
// Genetic Algorithm Engine — Pure functions, no React dependency
// ============================================================

// ---- Problem Definitions ----
export const PROBLEMS = {
  onemax: {
    id: 'onemax',
    name: 'OneMax',
    subtitle: 'Maximize 1s in a binary string',
    description:
      'The OneMax problem is the simplest GA benchmark: find the binary string of all 1s. Fitness equals the count of 1-bits. Optimal solution has fitness equal to the chromosome length.',
    alleles: ['0', '1'],
    randomGene: () => (Math.random() < 0.5 ? '1' : '0'),
    fitness: (chr) => chr.filter((g) => g === '1').length,
    maxFitness: (len) => len,
    chrLenEditable: true,
  },
  funcmax: {
    id: 'funcmax',
    name: 'f(x) = x²',
    subtitle: 'Binary-encoded function maximization',
    description:
      'Maximize f(x) = x² where x is a binary-encoded integer. The GA must discover the binary representation of the largest possible integer.',
    alleles: ['0', '1'],
    randomGene: () => (Math.random() < 0.5 ? '1' : '0'),
    fitness: (chr) => {
      const x = parseInt(chr.join(''), 2);
      return x * x;
    },
    maxFitness: (len) => (2 ** len - 1) ** 2,
    decode: (chr) => parseInt(chr.join(''), 2),
    chrLenEditable: true,
  },
  targetstr: {
    id: 'targetstr',
    name: 'Target String',
    subtitle: 'Evolve toward a target phrase',
    description:
      'Evolve a random string of letters until it matches the target. Fitness is the count of positions with the correct character. Watch evolution "discover" the target letter by letter!',
    alleles: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '.split(''),
    randomGene: () => {
      const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
      return c[Math.floor(Math.random() * c.length)];
    },
    fitness: (chr, target) => {
      let f = 0;
      for (let i = 0; i < chr.length; i++) {
        if (chr[i] === target[i]) f++;
      }
      return f;
    },
    maxFitness: (len) => len,
    chrLenEditable: false,
  },
};

// ---- Initialization ----
export function createRandomPopulation(problemId, popSize, chrLen, target) {
  const def = PROBLEMS[problemId];
  const population = [];
  for (let i = 0; i < popSize; i++) {
    const chr = [];
    for (let j = 0; j < chrLen; j++) chr.push(def.randomGene());
    population.push(chr);
  }
  return population;
}

// ---- Fitness Evaluation ----
export function evaluatePopulation(population, problemId, target) {
  const def = PROBLEMS[problemId];
  return population.map((chr) =>
    problemId === 'targetstr' ? def.fitness(chr, target) : def.fitness(chr)
  );
}

// ---- Selection ----
export function rouletteSelectWithDetails(fitnesses) {
  const total = fitnesses.reduce((a, b) => a + b, 0);
  if (total === 0) {
    const idx = Math.floor(Math.random() * fitnesses.length);
    return {
      idx,
      r: Math.random(),
      prob: 0,
      cumProb: 0,
      total: 0,
      allProbs: fitnesses.map(() => 0),
      allCumProbs: fitnesses.map(() => 0),
    };
  }

  // 1. Selection probability for each chromosome: p_i = f_i / total
  const allProbs = fitnesses.map((f) => f / total);

  // 2. Cumulative probability: q_i = sum_{j=0}^i p_j
  let cum = 0;
  const allCumProbs = allProbs.map((p) => {
    cum += p;
    return cum;
  });
  // Ensure last cumulative probability is 1.0 (avoids float precision drift)
  allCumProbs[allCumProbs.length - 1] = 1.0;

  // 3. Generate random number r in [0, 1)
  const r = Math.random();

  // 4. Select the first chromosome where cumulative probability q_i >= r
  let selectedIdx = allCumProbs.length - 1;
  for (let i = 0; i < allCumProbs.length; i++) {
    if (allCumProbs[i] >= r) {
      selectedIdx = i;
      break;
    }
  }

  return {
    idx: selectedIdx,
    r,
    prob: allProbs[selectedIdx],
    cumProb: allCumProbs[selectedIdx],
    prevCumProb: selectedIdx > 0 ? allCumProbs[selectedIdx - 1] : 0,
    allProbs,
    allCumProbs,
    total,
  };
}

export function rouletteSelect(fitnesses) {
  return rouletteSelectWithDetails(fitnesses).idx;
}

export function tournamentSelectWithDetails(fitnesses, k = 2) {
  const competitors = [];
  for (let i = 0; i < k; i++) {
    let idx = Math.floor(Math.random() * fitnesses.length);
    let tries = 0;
    while (competitors.includes(idx) && fitnesses.length > 1 && tries < 10) {
      idx = Math.floor(Math.random() * fitnesses.length);
      tries++;
    }
    competitors.push(idx);
  }

  let winner = competitors[0];
  let bestFit = fitnesses[winner] ?? 0;
  for (let i = 1; i < competitors.length; i++) {
    const cand = competitors[i];
    const candFit = fitnesses[cand] ?? 0;
    if (candFit > bestFit) {
      bestFit = candFit;
      winner = cand;
    }
  }

  return {
    idx: winner,
    competitors,
    competitorFitnesses: competitors.map((ci) => fitnesses[ci] ?? 0),
    r: null,
    prob: null,
    cumProb: null,
    method: 'tournament',
  };
}

export function tournamentSelect(fitnesses, k = 2) {
  return tournamentSelectWithDetails(fitnesses, k).idx;
}

export function rankSelect(fitnesses) {
  const sorted = fitnesses.map((f, i) => ({ f, i })).sort((a, b) => a.f - b.f);
  const ranks = new Array(fitnesses.length);
  sorted.forEach((s, rank) => {
    ranks[s.i] = rank + 1;
  });
  const total = ranks.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let cum = 0;
  for (let i = 0; i < ranks.length; i++) {
    cum += ranks[i];
    if (cum >= r) return i;
  }
  return ranks.length - 1;
}

export function selectParentWithDetails(fitnesses, method) {
  if (method === 'tournament') {
    return tournamentSelectWithDetails(fitnesses, 2);
  }
  if (method === 'rank') {
    const idx = rankSelect(fitnesses);
    return { idx, r: null, cumProb: null, prob: null, method: 'rank' };
  }
  return { ...rouletteSelectWithDetails(fitnesses), method: 'roulette' };
}

export function selectParent(fitnesses, method) {
  switch (method) {
    case 'roulette':
      return rouletteSelect(fitnesses);
    case 'tournament':
      return tournamentSelect(fitnesses);
    case 'rank':
      return rankSelect(fitnesses);
    default:
      return rouletteSelect(fitnesses);
  }
}

// ---- Crossover ----
export function singlePointCrossover(p1, p2) {
  const point = 1 + Math.floor(Math.random() * (p1.length - 1));
  const c1 = [...p1.slice(0, point), ...p2.slice(point)];
  const c2 = [...p2.slice(0, point), ...p1.slice(point)];
  return { children: [c1, c2], point };
}

export function singlePointCrossoverWithDetails(p1, p2, cxRate) {
  const r = Math.random();
  const performed = r < cxRate;

  if (performed) {
    const point = 1 + Math.floor(Math.random() * (p1.length - 1));
    const c1 = [...p1.slice(0, point), ...p2.slice(point)];
    const c2 = [...p2.slice(0, point), ...p1.slice(point)];
    return {
      children: [c1, c2],
      point,
      r,
      cxRate,
      performed: true,
    };
  }

  return {
    children: [[...p1], [...p2]],
    point: -1,
    r,
    cxRate,
    performed: false,
  };
}

// ---- Mutation ----
export function mutateChromosome(chr, rate, alleles) {
  const mutated = [...chr];
  const mutatedBits = [];
  for (let i = 0; i < mutated.length; i++) {
    if (Math.random() < rate) {
      if (alleles.length === 2) {
        mutated[i] = mutated[i] === alleles[0] ? alleles[1] : alleles[0];
      } else {
        let newGene;
        do {
          newGene = alleles[Math.floor(Math.random() * alleles.length)];
        } while (newGene === mutated[i]);
        mutated[i] = newGene;
      }
      mutatedBits.push(i);
    }
  }
  return { chr: mutated, bits: mutatedBits };
}

export function mutateChromosomeWithDetails(chr, rate, alleles) {
  const mutated = [...chr];
  const mutatedBits = [];
  const geneDetails = [];

  for (let i = 0; i < mutated.length; i++) {
    const r = Math.random();
    const willMutate = r < rate;
    const oldVal = mutated[i];

    if (willMutate) {
      let newGene;
      if (alleles.length === 2) {
        newGene = oldVal === alleles[0] ? alleles[1] : alleles[0];
      } else {
        do {
          newGene = alleles[Math.floor(Math.random() * alleles.length)];
        } while (newGene === oldVal && alleles.length > 1);
      }
      mutated[i] = newGene;
      mutatedBits.push(i);
      geneDetails.push({ pos: i, r, rate, mutated: true, before: oldVal, after: newGene });
    } else {
      geneDetails.push({ pos: i, r, rate, mutated: false, before: oldVal, after: oldVal });
    }
  }

  return { chr: mutated, bits: mutatedBits, details: geneDetails };
}

// ---- Diversity ----
export function computeDiversity(population) {
  const unique = new Set(population.map((c) => c.join('')));
  return unique.size / population.length;
}

// ---- Gene Frequency (for heatmap) ----
export function computeGeneFrequencies(population, alleles) {
  if (population.length === 0) return [];
  const chrLen = population[0].length;
  const freq = [];
  for (let pos = 0; pos < chrLen; pos++) {
    const counts = {};
    alleles.forEach((a) => (counts[a] = 0));
    population.forEach((chr) => {
      if (chr[pos] !== undefined) counts[chr[pos]]++;
    });
    // Convert to frequencies
    Object.keys(counts).forEach((k) => {
      counts[k] = counts[k] / population.length;
    });
    freq.push(counts);
  }
  return freq;
}

// ---- Textbook Example (f(x) = x²) ----
export function runTextbookExample() {
  const pop = [
    ['0', '1', '1', '0', '1'], // x=13
    ['1', '1', '0', '0', '0'], // x=24
    ['0', '1', '0', '0', '0'], // x=8
    ['1', '0', '0', '1', '1'], // x=19
  ];

  const decode = (c) => parseInt(c.join(''), 2);
  const fitness = (c) => decode(c) ** 2;

  const fitnesses = pop.map(fitness);
  const totalFit = fitnesses.reduce((a, b) => a + b, 0);

  // Selection probabilities
  const probs = fitnesses.map((f) => f / totalFit);

  // Fixed crossover for reproducibility
  const crossovers = [
    { parents: [0, 1], point: 3 },
    { parents: [2, 3], point: 2 },
  ];

  const postCrossover = [];
  crossovers.forEach(({ parents: [p1, p2], point }) => {
    const c1 = [...pop[p1].slice(0, point), ...pop[p2].slice(point)];
    const c2 = [...pop[p2].slice(0, point), ...pop[p1].slice(point)];
    postCrossover.push(c1, c2);
  });

  // Bit mutation:
  // Offspring 1 (O1): no mutation -> [0, 1, 1, 0, 0] (x=12, f(x)=144)
  // Offspring 2 (O2): bit 2 ('0' -> '1') -> [1, 1, 1, 0, 1] (x=29, f(x)=841)
  // Offspring 3 (O3): no mutation -> [0, 1, 0, 1, 1] (x=11, f(x)=121)
  // Offspring 4 (O4): bit 4 ('0' -> '1') -> [1, 0, 0, 0, 1] (x=17, f(x)=289)
  const mutations = [
    { childIdx: 0, mutatedBits: [] },
    { childIdx: 1, mutatedBits: [2] },
    { childIdx: 2, mutatedBits: [] },
    { childIdx: 3, mutatedBits: [4] },
  ];

  const finalOffspring = postCrossover.map((chr, i) => {
    const mutated = [...chr];
    mutations[i].mutatedBits.forEach((bitPos) => {
      mutated[bitPos] = mutated[bitPos] === '1' ? '0' : '1';
    });
    return mutated;
  });

  const newFitnesses = finalOffspring.map(fitness);
  const newTotal = newFitnesses.reduce((a, b) => a + b, 0);

  return {
    initialPop: pop.map((c, i) => ({
      chr: c,
      binary: c.join(''),
      x: decode(c),
      fitness: fitnesses[i],
      prob: probs[i],
    })),
    totalFitness: totalFit,
    crossovers: crossovers.map(({ parents: [p1, p2], point }, i) => ({
      parent1: { idx: p1, chr: pop[p1], x: decode(pop[p1]) },
      parent2: { idx: p2, chr: pop[p2], x: decode(pop[p2]) },
      point,
      child1: {
        chr: postCrossover[i * 2],
        x: decode(postCrossover[i * 2]),
        fitness: fitness(postCrossover[i * 2]),
      },
      child2: {
        chr: postCrossover[i * 2 + 1],
        x: decode(postCrossover[i * 2 + 1]),
        fitness: fitness(postCrossover[i * 2 + 1]),
      },
    })),
    mutations: mutations.map(({ childIdx, mutatedBits }) => ({
      childIdx,
      beforeChr: postCrossover[childIdx],
      afterChr: finalOffspring[childIdx],
      mutatedBits,
      beforeX: decode(postCrossover[childIdx]),
      afterX: decode(finalOffspring[childIdx]),
      beforeFitness: fitness(postCrossover[childIdx]),
      afterFitness: fitness(finalOffspring[childIdx]),
    })),
    newPop: finalOffspring.map((c, i) => ({
      chr: c,
      binary: c.join(''),
      x: decode(c),
      fitness: newFitnesses[i],
      mutatedBits: mutations[i].mutatedBits,
    })),
    newTotalFitness: newTotal,
    oldAvg: totalFit / 4,
    newAvg: newTotal / 4,
  };
}
