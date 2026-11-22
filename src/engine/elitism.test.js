import { test } from "node:test";
import assert from "node:assert/strict";
import { selectElites, applyElitism } from "./elitism.js";

const pop = [
  ["0","1","1","0","1"],
  ["1","1","0","0","0"],
  ["0","1","0","0","0"],
  ["1","0","0","1","1"],
];
const fit = [169, 576, 64, 361];

test("selects the single fittest chromosome", () => {
  assert.deepEqual(selectElites(pop, fit, 1), [["1","1","0","0","0"]]);
});

test("selects top 2 in order of fitness", () => {
  assert.deepEqual(selectElites(pop, fit, 2), [
    ["1","1","0","0","0"],
    ["1","0","0","1","1"],
  ]);
});

test("elites are copies, not references", () => {
  const [elite] = selectElites(pop, fit, 1);
  elite[0] = "X";
  assert.equal(pop[1][0], "1");
});

test("count larger than population is capped", () => {
  assert.equal(selectElites(pop, fit, 10).length, 4);
});

test("applyElitism keeps population size constant", () => {
  assert.deepEqual(applyElitism(["a","b","c","d"], ["E"]), ["E","a","b","c"]);
});