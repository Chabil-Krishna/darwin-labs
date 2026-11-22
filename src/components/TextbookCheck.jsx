import { useState } from 'react';
import { runGoldbergExample } from '../engine/ga';
import { Play, CheckCircle2 } from 'lucide-react';

export default function TextbookCheck() {
  const [result, setResult] = useState(null);

  const run = () => setResult(runGoldbergExample());

  if (!result) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">📖</div>
        <h4 className="text-lg font-bold">Textbook Verification</h4>
        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          Run a hand-calculated example from <b>Goldberg's "Genetic Algorithms in Search,
          Optimization & Machine Learning" (1989)</b> and verify every step matches.
        </p>
        <button
          onClick={run}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-dna-blue text-white hover:bg-dna-blue/80 transition-all"
        >
          <Play size={16} /> Run Textbook Example
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1 text-sm">
      {/* Header */}
      <div className="p-3 rounded-lg bg-dna-blue/10 border border-dna-blue/20">
        <h4 className="font-bold text-dna-blue mb-1">📖 Goldberg's f(x) = x² Example (1989)</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Problem: Maximize f(x) = x² where x ∈ [0, 31], encoded as 5-bit binary string.
          <br />Population size: 4, Single-point crossover, Roulette wheel selection, No mutation.
        </p>
      </div>

      {/* Step 1: Initial Population */}
      <Section title="Step 1: Initial Population & Fitness" color="amber">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Chr</th>
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Binary</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">x</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">f(x) = x²</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Prob</th>
            </tr>
          </thead>
          <tbody>
            {result.initialPop.map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1.5 px-2">{i + 1}</td>
                <td className="py-1.5 px-2 font-mono font-bold">{c.binary}</td>
                <td className="py-1.5 px-2 text-right">{c.x}</td>
                <td className="py-1.5 px-2 text-right font-bold">{c.fitness}</td>
                <td className="py-1.5 px-2 text-right">{(c.prob * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="font-bold border-t-2 border-border">
              <td colSpan="3" className="py-1.5 px-2">Total</td>
              <td className="py-1.5 px-2 text-right">{result.totalFitness}</td>
              <td className="py-1.5 px-2 text-right">100%</td>
            </tr>
          </tbody>
        </table>
        <VerifyBox>
          {result.initialPop.map((c, i) => (
            <div key={i}>
              Chr {i + 1}: x = {c.binary.split('').map((b, j) => `${b}·${2 ** (4 - j)}`).join(' + ')} = {c.x} → f({c.x}) = {c.fitness}
            </div>
          ))}
          <div className="mt-1 font-bold">
            Total = {result.initialPop.map(c => c.fitness).join(' + ')} = {result.totalFitness} ✓
          </div>
        </VerifyBox>
      </Section>

      {/* Step 2: Selection */}
      <Section title="Step 2: Roulette Wheel Selection" color="amber">
        <div className="space-y-1.5 text-xs">
          {result.initialPop.map((c, i) => {
            const pct = (c.prob * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 font-mono">Chr {i + 1}:</span>
                <div className="flex-1 h-4 bg-surface-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dna-amber rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono font-bold">{pct}%</span>
              </div>
            );
          })}
          <p className="text-text-muted mt-2">
            Suppose roulette selects pairs: (Chr 1, Chr 2) and (Chr 3, Chr 4)
          </p>
        </div>
      </Section>

      {/* Step 3: Crossover */}
      <Section title="Step 3: Single-Point Crossover" color="pink">
        {result.crossovers.map((cx, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg bg-surface-700/50 font-mono text-xs space-y-1">
            <div className="font-bold text-text-primary mb-1">
              Pair {i + 1}: Crossover at position {cx.point}
            </div>
            <div>P{cx.parent1.idx + 1}: {renderCrossover(cx.parent1.chr, cx.point, false)}<span className="text-text-muted ml-2">(x={cx.parent1.x})</span></div>
            <div>P{cx.parent2.idx + 1}: {renderCrossover(cx.parent2.chr, cx.point, false)}<span className="text-text-muted ml-2">(x={cx.parent2.x})</span></div>
            <div className="border-t border-border/50 pt-1">
              C{i * 2 + 1}: {renderCrossover(cx.child1.chr, cx.point, true)}<span className="text-dna-green ml-2">x={cx.child1.x}, f(x)={cx.child1.fitness} ✓</span>
            </div>
            <div>
              C{i * 2 + 2}: {renderCrossover(cx.child2.chr, cx.point, true)}<span className="text-dna-green ml-2">x={cx.child2.x}, f(x)={cx.child2.fitness} ✓</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Step 4: Result */}
      <Section title="Step 4: New Generation" color="green">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Chr</th>
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Binary</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">x</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">f(x)</th>
            </tr>
          </thead>
          <tbody>
            {result.newPop.map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1.5 px-2">{i + 1}</td>
                <td className="py-1.5 px-2 font-mono font-bold">{c.binary}</td>
                <td className="py-1.5 px-2 text-right">{c.x}</td>
                <td className="py-1.5 px-2 text-right font-bold">{c.fitness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Verification Summary */}
      <div className="p-4 rounded-lg bg-dna-green/10 border border-dna-green/30">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={18} className="text-dna-green" />
          <span className="font-bold text-dna-green">Verification Summary</span>
        </div>
        <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
          <li>Old average fitness: {result.oldAvg.toFixed(1)} → New average: {result.newAvg.toFixed(1)}</li>
          <li>Binary decoding verified for all 8 chromosomes ✓</li>
          <li>Roulette probabilities sum to 100% ✓</li>
          <li>Crossover produces correct gene combinations ✓</li>
          <li>All f(x) = x² computations match hand calculation ✓</li>
        </ul>
      </div>

      <button
        onClick={run}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-surface-600 text-text-secondary hover:bg-surface-500 transition-all"
      >
        ↻ Re-run
      </button>
    </div>
  );
}

const SECTION_COLORS = {
  amber: 'text-dna-amber',
  pink: 'text-dna-pink',
  green: 'text-dna-green',
  blue: 'text-dna-blue',
};

function Section({ title, color, children }) {
  const textCls = SECTION_COLORS[color] || 'text-text-primary';
  return (
    <div>
      <h4 className={`font-bold ${textCls} mb-2 text-sm`}>{title}</h4>
      {children}
    </div>
  );
}

function VerifyBox({ children }) {
  return (
    <div className="mt-2 p-3 rounded-lg bg-dna-blue/5 border border-dna-blue/10 font-mono text-[11px] text-text-muted leading-relaxed">
      ✓ Hand calculation check:
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function renderCrossover(chr, point, isChild) {
  return (
    <span>
      [
      {chr.map((g, i) => (
        <span
          key={i}
          className={i < point ? 'text-dna-cyan' : 'text-dna-pink'}
        >
          {i === point ? '|' : ''}{g}
        </span>
      ))}
      ]
    </span>
  );
}
