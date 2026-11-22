import { useState } from 'react';
import { PROBLEMS } from '../engine/ga';
import InfoTooltip from './InfoTooltip';
import {
  Play, Pause, SkipForward, RotateCcw,
  Zap, Users, Ruler, Shuffle, Dna, Shield, Gauge, Target, Timer
} from 'lucide-react';

export default function ControlPanel({
  params, updateParams, playing, speed, setSpeed,
  timeRemaining, totalTime,
  onPlay, onPause, onStep, onReset, state,
}) {
  const def = PROBLEMS[params.problem];
  const chrLen = params.problem === 'targetstr' ? params.target.length : params.chrLen;
  const fits = state.fitnesses;
  const best = fits.length > 0 ? Math.max(...fits) : '—';
  const avg = fits.length > 0 ? (fits.reduce((a, b) => a + b, 0) / fits.length).toFixed(1) : '—';
  const diversity = fits.length > 0
    ? ((new Set(state.population.map(c => c.join('')))).size / state.population.length * 100).toFixed(0)
    : '—';

  const bestIdx = fits.length > 0 ? fits.indexOf(Math.max(...fits)) : -1;
  const bestChr = bestIdx >= 0 ? state.population[bestIdx] : null;

  return (
    <aside className="flex flex-col gap-3.5 w-full lg:w-[320px] shrink-0">

      {/* Problem */}
      <Card icon={<Target size={14} className="text-orange-500" />} title="Problem">
        <select
          value={params.problem}
          onChange={(e) => updateParams({ problem: e.target.value })}
          className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-medium text-stone-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
        >
          {Object.values(PROBLEMS).map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.subtitle}</option>
          ))}
        </select>
        <p className="text-xs text-stone-600 leading-relaxed mt-2.5 p-2.5 rounded-lg bg-orange-50/70 border border-orange-100">
          {def.description}
        </p>
        {params.problem === 'targetstr' && (
          <div className="mt-2.5">
            <label className="text-xs text-orange-950 font-semibold">Target String</label>
            <input
              type="text"
              value={params.target}
              maxLength={12}
              onChange={(e) => updateParams({ target: e.target.value.toUpperCase() })}
              className="mt-1 w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-orange-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        )}
      </Card>

      {/* Parameters */}
      <Card icon={<Zap size={14} className="text-orange-500" />} title="Parameters">
        <div className="space-y-3.5">
          <Slider
            icon={<Users size={12} className="text-orange-500" />}
            label="Population Size"
            tooltip="Number of candidate solutions in each generation. Larger populations explore more combinations and prevent inbreeding, but require more fitness computations per generation."
            value={params.popSize}
            min={4}
            max={20}
            step={2}
            onChange={(v) => updateParams({ popSize: v })}
          />
          <Slider
            icon={<Ruler size={12} className="text-orange-500" />}
            label="Chromosome Length"
            tooltip="Number of genes per individual. Defines the resolution and dimensionality of the search space (2ᴸ for binary). Longer chromosomes take more generations to optimize."
            value={chrLen}
            min={4}
            max={16}
            step={1}
            disabled={!def.chrLenEditable}
            onChange={(v) => updateParams({ chrLen: v })}
          />
          <Slider
            icon={<Shuffle size={12} className="text-orange-500" />}
            label="Crossover Rate"
            tooltip="Probability that selected parents mate and recombine genes. High rates (0.6–0.9) promote rapid sharing of good traits; low rates rely primarily on cloning and mutation."
            value={params.cxRate}
            min={0}
            max={1}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => updateParams({ cxRate: v })}
          />
          <Slider
            icon={<Dna size={12} className="text-orange-500" />}
            label="Mutation Rate"
            tooltip="Probability of flipping individual genes. Keeps the gene pool diverse and escapes local optima. If set too high, the algorithm degrades into a random search."
            value={params.mutRate}
            min={0}
            max={0.5}
            step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={(v) => updateParams({ mutRate: v })}
          />
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-stone-700 font-medium flex items-center gap-1">
                <Shield size={12} className="text-orange-500" /> Selection Method
                <InfoTooltip text="How parents are chosen based on fitness. Roulette is fitness-proportional, Tournament picks the best from random groups, and Rank balances selection pressure." />
              </label>
            </div>
            <select
              value={params.selection}
              onChange={(e) => updateParams({ selection: e.target.value })}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
            >
              <option value="roulette">Roulette Wheel</option>
              <option value="tournament">Tournament (k=3)</option>
              <option value="rank">Rank-Based</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transport Controls */}
      <Card icon={<Play size={14} className="text-orange-500" />} title="Controls">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPlay}
            disabled={playing || state.converged}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
          >
            <Play size={14} /> Play
          </button>
          <button
            onClick={onPause}
            disabled={!playing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Pause size={14} /> Pause
          </button>
          <button
            onClick={onStep}
            disabled={playing || state.converged}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
          >
            <SkipForward size={14} /> Step
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-orange-700 border border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="mt-3.5 pt-3 border-t border-orange-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-600 flex items-center gap-1"><Gauge size={12} className="text-orange-500" /> Step Interval</span>
            <span className="font-bold text-orange-600 font-mono">{speed}s</span>
          </div>
          <input
            type="range"
            min={5}
            max={10}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-orange-500 h-1.5 rounded-full appearance-none bg-orange-100 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md"
          />
          <div className="flex justify-between text-[10px] text-stone-500 mt-1 font-mono">
            <span>5s (Faster)</span>
            <span>10s (Slower)</span>
          </div>
        </div>

        {/* 10s Time-Lapse Countdown Visualizer */}
        {playing && (
          <div className="mt-3 p-2.5 rounded-lg bg-orange-50 border border-orange-300">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-orange-900 font-semibold flex items-center gap-1.5">
                <Timer size={13} className="text-orange-600 animate-spin" /> Next step in
              </span>
              <span className="font-mono font-extrabold text-orange-600 text-sm">
                {(Math.max(0, timeRemaining || 0) / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="w-full h-1.5 bg-orange-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-100 ease-linear rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, (((totalTime || 10000) - (timeRemaining || 0)) / (totalTime || 10000)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Stats */}
      <Card icon={<Zap size={14} className="text-orange-500" />} title="Statistics">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Best Fitness" value={best} />
          <StatBox label="Avg Fitness" value={avg} />
          <StatBox label="Generation" value={state.generation} />
          <StatBox label="Diversity" value={diversity === '—' ? '—' : `${diversity}%`} />
        </div>
        {bestChr && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-[11px] text-orange-950 font-medium mb-0.5">Best Chromosome</div>
            <div className="font-mono text-sm font-bold text-orange-600 break-all">
              {params.problem === 'funcmax'
                ? `[${bestChr.join('')}] = x=${parseInt(bestChr.join(''), 2)}`
                : bestChr.join('')}
            </div>
          </div>
        )}
      </Card>
    </aside>
  );
}

// ---- Sub-components ----
function Card({ icon, title, children }) {
  return (
    <div className="bg-white border border-orange-200 shadow-sm shadow-orange-100/50 rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5 mb-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Slider({ icon, label, tooltip, value, min, max, step, format, onChange, disabled }) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-stone-700 font-medium flex items-center gap-1">
          {icon} {label}
          {tooltip && <InfoTooltip text={tooltip} align="left" position="top" />}
        </span>
        <span className="font-bold text-orange-900 font-mono">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-orange-100 cursor-pointer accent-orange-500
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-sm"
      />
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center p-2.5 rounded-lg bg-orange-50/70 border border-orange-200">
      <div className="text-[11px] text-stone-600 font-medium">{label}</div>
      <div className="text-lg font-extrabold text-orange-600 font-mono mt-0.5">{value}</div>
    </div>
  );
}
