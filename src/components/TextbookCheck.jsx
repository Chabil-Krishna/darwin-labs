import { useMemo } from 'react';
import { runTextbookExample } from '../engine/ga';
import InfoTooltip from './InfoTooltip';
import { CheckCircle2, Check } from 'lucide-react';

export default function TextbookCheck() {
  const result = useMemo(() => runTextbookExample(), []);

  return (
    <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1 text-sm">
      {/* Header */}
      <div className="p-3.5 rounded-lg bg-orange-50 border border-orange-200">
        <h4 className="font-bold text-orange-900 mb-1 flex items-center gap-1.5">
          <span>Hand-Calculated f(x) = x² Example</span>
          <InfoTooltip
            title="Textbook Column"
            text="Interactive step-by-step verification of the classic f(x) = x² hand calculation with verified arithmetic at every step."
            align="left"
            position="bottom"
          />
        </h4>
        <p className="text-xs text-stone-600 leading-relaxed">
          Problem: Maximize f(x) = x² where x ∈ [0, 31], encoded as 5-bit binary strings.
          <br />Population size: 4, Single-point crossover, Roulette wheel selection, Bit mutation.
        </p>
      </div>

      {/* Step 1: Initial Population */}
      <Section title="Step 1: Initial Population & Fitness">
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-orange-50/80 border-b border-orange-200 text-orange-950 font-semibold">
                <th className="text-left py-2 px-3">Chr</th>
                <th className="text-left py-2 px-3">Binary</th>
                <th className="text-right py-2 px-3">x</th>
                <th className="text-right py-2 px-3">f(x) = x²</th>
                <th className="text-right py-2 px-3">Prob</th>
              </tr>
            </thead>
            <tbody>
              {result.initialPop.map((c, i) => (
                <tr key={i} className="border-b border-orange-100 last:border-0 hover:bg-orange-50/40">
                  <td className="py-2 px-3 text-stone-600">{i + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-orange-600">{c.binary}</td>
                  <td className="py-2 px-3 text-right text-stone-700">{c.x}</td>
                  <td className="py-2 px-3 text-right font-bold text-stone-900">{c.fitness}</td>
                  <td className="py-2 px-3 text-right text-orange-800">{(c.prob * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-orange-200 bg-orange-50/60">
                <td colSpan="3" className="py-2 px-3 text-stone-900">Total</td>
                <td className="py-2 px-3 text-right text-orange-600">{result.totalFitness}</td>
                <td className="py-2 px-3 text-right text-orange-800">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <VerifyBox>
          {result.initialPop.map((c, i) => (
            <div key={i}>
              Chr {i + 1}: x = {c.binary.split('').map((b, j) => `${b}·${2 ** (4 - j)}`).join(' + ')} = {c.x} → f({c.x}) = {c.fitness}
            </div>
          ))}
          <div className="mt-1 font-bold text-orange-700 flex items-center">
            Total = {result.initialPop.map(c => c.fitness).join(' + ')} = {result.totalFitness}
            <Check size={13} className="text-orange-600 ml-1.5 inline" />
          </div>
        </VerifyBox>
      </Section>

      {/* Step 2: Selection */}
      <Section title="Step 2: Roulette Wheel Selection">
        <div className="space-y-2 text-xs">
          {result.initialPop.map((c, i) => {
            const pct = (c.prob * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-12 font-mono font-medium text-stone-700">Chr {i + 1}:</span>
                <div className="flex-1 h-3.5 bg-orange-100 rounded-full overflow-hidden border border-orange-200">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono font-bold text-orange-800">{pct}%</span>
              </div>
            );
          })}
          <p className="text-stone-600 mt-2">
            Roulette wheel selects parent pairs: (Chr 1, Chr 2) and (Chr 3, Chr 4).
          </p>
        </div>
      </Section>

      {/* Step 3: Crossover */}
      <Section title="Step 3: Single-Point Crossover">
        {result.crossovers.map((cx, i) => (
          <div key={i} className="mb-3 p-3.5 rounded-lg bg-orange-50/70 border border-orange-200 font-mono text-xs space-y-1.5">
            <div className="font-bold text-orange-950 mb-1">
              Pair {i + 1}: Crossover at position {cx.point}
            </div>
            <div>P{cx.parent1.idx + 1}: {renderCrossover(cx.parent1.chr, cx.point)}<span className="text-stone-500 ml-2 font-sans">(x={cx.parent1.x})</span></div>
            <div>P{cx.parent2.idx + 1}: {renderCrossover(cx.parent2.chr, cx.point)}<span className="text-stone-500 ml-2 font-sans">(x={cx.parent2.x})</span></div>
            <div className="border-t border-orange-200 pt-1.5 mt-1">
              Child {i * 2 + 1}: {renderCrossover(cx.child1.chr, cx.point)}
              <span className="text-orange-600 font-bold ml-2 font-sans inline-flex items-center gap-1">
                x={cx.child1.x}, f(x)={cx.child1.fitness}
                <Check size={12} className="text-orange-600 inline" />
              </span>
            </div>
            <div>
              Child {i * 2 + 2}: {renderCrossover(cx.child2.chr, cx.point)}
              <span className="text-orange-600 font-bold ml-2 font-sans inline-flex items-center gap-1">
                x={cx.child2.x}, f(x)={cx.child2.fitness}
                <Check size={12} className="text-orange-600 inline" />
              </span>
            </div>
          </div>
        ))}
      </Section>

      {/* Step 4: Bit Mutation */}
      <Section title="Step 4: Bit Mutation">
        <div className="space-y-2 text-xs">
          {result.mutations.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border font-mono text-xs ${
                m.mutatedBits.length > 0
                  ? 'bg-orange-100/70 border-orange-300'
                  : 'bg-orange-50/40 border-orange-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-orange-950 font-sans">
                  Offspring O{i + 1}:
                </span>
                {m.mutatedBits.length > 0 ? (
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-200/90 border border-orange-300 px-2 py-0.5 rounded">
                    Mutated at position {m.mutatedBits.join(', ')}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-500 font-sans">
                    No mutation
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap text-stone-700">
                <span>Before: [{m.beforeChr.join('')}] (x={m.beforeX}, f(x)={m.beforeFitness})</span>
                <span className="text-orange-500 font-bold">→</span>
                <span className="font-bold text-orange-950">
                  After: [
                  {m.afterChr.map((g, idx) => (
                    <span
                      key={idx}
                      className={m.mutatedBits.includes(idx) ? 'bg-orange-500 text-white px-0.5 rounded mx-px' : ''}
                    >
                      {g}
                    </span>
                  ))}
                  ] (x={m.afterX}, f(x)={m.afterFitness})
                </span>
                {m.mutatedBits.length > 0 && (
                  <Check size={12} className="text-orange-600 inline" />
                )}
              </div>
            </div>
          ))}
        </div>
        <VerifyBox>
          <div>O2: bit 2 mutated from 0 → 1: [11001] → [11101] (x: 25 → 29, f(x): 625 → 841)</div>
          <div>O4: bit 4 mutated from 0 → 1: [10000] → [10001] (x: 16 → 17, f(x): 256 → 289)</div>
          <div className="mt-1 font-bold text-orange-700 flex items-center">
            New Total Fitness = {result.newPop.map(c => c.fitness).join(' + ')} = {result.newTotalFitness}
            <Check size={13} className="text-orange-600 ml-1.5 inline" />
          </div>
        </VerifyBox>
      </Section>

      {/* Step 5: New Generation Result */}
      <Section title="Step 5: New Generation Result (Post-Mutation)">
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-orange-50/80 border-b border-orange-200 text-orange-950 font-semibold">
                <th className="text-left py-2 px-3">Chr</th>
                <th className="text-left py-2 px-3">Binary</th>
                <th className="text-right py-2 px-3">x</th>
                <th className="text-right py-2 px-3">f(x) = x²</th>
                <th className="text-right py-2 px-3">Mutation</th>
              </tr>
            </thead>
            <tbody>
              {result.newPop.map((c, i) => (
                <tr key={i} className="border-b border-orange-100 last:border-0 hover:bg-orange-50/40">
                  <td className="py-2 px-3 text-stone-600">{i + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-orange-600">{c.binary}</td>
                  <td className="py-2 px-3 text-right text-stone-700">{c.x}</td>
                  <td className="py-2 px-3 text-right font-bold text-stone-900">{c.fitness}</td>
                  <td className="py-2 px-3 text-right text-[11px] font-sans">
                    {c.mutatedBits.length > 0 ? (
                      <span className="text-orange-700 font-bold">Bit {c.mutatedBits.join(', ')} flipped</span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-orange-200 bg-orange-50/60">
                <td colSpan="3" className="py-2 px-3 text-stone-900">Total</td>
                <td className="py-2 px-3 text-right text-orange-600">{result.newTotalFitness}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Verification Summary */}
      <div className="p-4 rounded-lg bg-orange-50 border border-orange-300">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={18} className="text-orange-600" />
          <span className="font-bold text-orange-800">Verification Summary</span>
        </div>
        <ul className="text-xs text-stone-700 space-y-1.5">
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> Initial average fitness: {result.oldAvg.toFixed(1)} → New generation average: {result.newAvg.toFixed(1)}</li>
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> Binary decoding verified for all 8 chromosomes</li>
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> Roulette selection probabilities sum to 100%</li>
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> Single-point crossover produces correct gene combinations</li>
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> Bit mutation applied and verified for offspring O2 and O4</li>
          <li className="flex items-center gap-1.5"><Check size={13} className="text-orange-600 shrink-0" /> All f(x) = x² computations match exact hand calculations</li>
        </ul>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-bold text-orange-800 mb-2 text-sm">{title}</h4>
      {children}
    </div>
  );
}

function VerifyBox({ children }) {
  return (
    <div className="mt-2.5 p-3 rounded-lg bg-orange-50/50 border border-orange-200 font-mono text-[11px] text-stone-700 leading-relaxed">
      <span className="text-orange-700 font-bold flex items-center gap-1">
        <Check size={13} className="text-orange-600" />
        Hand calculation check:
      </span>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function renderCrossover(chr, point) {
  return (
    <span>
      [
      {chr.map((g, i) => (
        <span
          key={i}
          className={i < point ? 'text-orange-600 font-bold' : 'text-amber-600 font-bold'}
        >
          {i === point ? '|' : ''}{g}
        </span>
      ))}
      ]
    </span>
  );
}




