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
      "Maximize f(x) = x² where x is a binary-encoded integer. This is Goldberg's (1989) classic textbook example. The GA must discover the binary representation of the largest possible integer.",
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
export function rouletteSelect(fitnesses) {
  const total = fitnesses.reduce((a, b) => a + b, 0);
  if (total === 0) return Math.floor(Math.random() * fitnesses.length);
  const r = Math.random() * total;
  let cum = 0;
  for (let i = 0; i < fitnesses.length; i++) {
    cum += fitnesses[i];
    if (cum >= r) return i;
  }
  return fitnesses.length - 1;
}

export function tournamentSelect(fitnesses, k = 3) {
  let best = -1;
  let bestFit = -Infinity;
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * fitnesses.length);
    if (fitnesses[idx] > bestFit) {
      bestFit = fitnesses[idx];
      best = idx;
    }
  }
  return best;
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

// ---- Textbook Example (Goldberg 1989) ----
export function runGoldbergExample() {
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

  const offspring = [];
  crossovers.forEach(({ parents: [p1, p2], point }) => {
    const c1 = [...pop[p1].slice(0, point), ...pop[p2].slice(point)];
    const c2 = [...pop[p2].slice(0, point), ...pop[p1].slice(point)];
    offspring.push(c1, c2);
  });

  const newFitnesses = offspring.map(fitness);
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
        chr: offspring[i * 2],
        x: decode(offspring[i * 2]),
        fitness: fitness(offspring[i * 2]),
      },
      child2: {
        chr: offspring[i * 2 + 1],
        x: decode(offspring[i * 2 + 1]),
        fitness: fitness(offspring[i * 2 + 1]),
      },
    })),
    newPop: offspring.map((c, i) => ({
      chr: c,
      binary: c.join(''),
      x: decode(c),
      fitness: newFitnesses[i],
    })),
    newTotalFitness: newTotal,
    oldAvg: totalFit / 4,
    newAvg: newTotal / 4,
  };
}
