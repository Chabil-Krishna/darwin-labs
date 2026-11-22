
export function selectElites(population, fitnesses, count = 1) {
  if (population.length !== fitnesses.length) {
    throw new Error("population and fitnesses must be the same length");
  }
  const n = Math.max(0, Math.min(count, population.length));
  return population
    .map((individual, i) => ({ individual, fitness: fitnesses[i] }))
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, n)
    .map((e) => structuredClone(e.individual));
}

export function selectElitesWithIndices(population, fitnesses, count = 1) {
  if (population.length !== fitnesses.length) {
    throw new Error("population and fitnesses must be the same length");
  }
  const n = Math.max(0, Math.min(count, population.length));
  const ranked = population
    .map((individual, i) => ({ individual, fitness: fitnesses[i], index: i }))
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, n);

  return {
    elites: ranked.map((e) => structuredClone(e.individual)),
    indices: ranked.map((e) => e.index),
  };
}

export function applyElitism(offspring, elites, targetSize) {
  const size = targetSize ?? (offspring.length + elites.length);
  return [...elites, ...offspring].slice(0, size);
}
