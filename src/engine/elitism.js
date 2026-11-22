
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


export function applyElitism(offspring, elites) {
  const size = offspring.length;
  return [...elites, ...offspring].slice(0, size);
}