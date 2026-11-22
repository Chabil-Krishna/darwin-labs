import { PROBLEMS } from '../engine/ga';
import {
  Play, Pause, SkipForward, RotateCcw,
  Zap, Users, Ruler, Shuffle, Dna, Shield, Gauge, Target
} from 'lucide-react';

const SPEED_LABELS = { 1: 'Very Slow', 2: 'Slow', 3: 'Medium', 4: 'Fast', 5: 'Blazing' };

export default function ControlPanel({
  params, updateParams, playing, speed, setSpeed,
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
    <aside className="flex flex-col gap-3 w-[310px] shrink-0">

      {/* Problem */}
      <Card icon={<Target size={14} className="text-dna-blue" />} title="Problem">
        <select
          value={params.problem}
          onChange={(e) => updateParams({ problem: e.target.value })}
          className="w-full bg-surface-700 border border-border-light rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-dna-blue cursor-pointer"
        >
          {Object.values(PROBLEMS).map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.subtitle}</option>
          ))}
        </select>
        <p className="text-xs text-text-muted leading-relaxed mt-2 p-2.5 rounded-lg bg-surface-700/50">
          {def.description}
        </p>
        {params.problem === 'targetstr' && (
          <div className="mt-2">
            <label className="text-xs text-text-secondary font-medium">Target String</label>
            <input
              type="text"
              value={params.target}
              maxLength={12}
              onChange={(e) => updateParams({ target: e.target.value.toUpperCase() })}
              className="mt-1 w-full bg-surface-700 border border-border-light rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-dna-blue"
            />
          </div>
        )}
      </Card>

      {/* Parameters */}
      <Card icon={<Zap size={14} className="text-dna-amber" />} title="Parameters">
        <div className="space-y-3">
          <Slider icon={<Users size={12} />} label="Population Size" value={params.popSize} min={4} max={20} step={2}
            onChange={(v) => updateParams({ popSize: v })} />
          <Slider icon={<Ruler size={12} />} label="Chromosome Length" value={chrLen}
            min={4} max={16} step={1}
            disabled={!def.chrLenEditable}
            onChange={(v) => updateParams({ chrLen: v })} />
          <Slider icon={<Shuffle size={12} />} label="Crossover Rate" value={params.cxRate}
            min={0} max={1} step={0.05} format={(v) => v.toFixed(2)}
            onChange={(v) => updateParams({ cxRate: v })} />
          <Slider icon={<Dna size={12} />} label="Mutation Rate" value={params.mutRate}
            min={0} max={0.5} step={0.01} format={(v) => v.toFixed(2)}
            onChange={(v) => updateParams({ mutRate: v })} />
          <div>
            <label className="text-xs text-text-muted font-medium flex items-center gap-1.5 mb-1">
              <Shield size={12} /> Selection Method
            </label>
            <select
              value={params.selection}
              onChange={(e) => updateParams({ selection: e.target.value })}
              className="w-full bg-surface-700 border border-border-light rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-dna-blue cursor-pointer"
            >
              <option value="roulette">Roulette Wheel</option>
              <option value="tournament">Tournament (k=3)</option>
              <option value="rank">Rank-Based</option>
            </select>
          </div>
          <Slider icon={<Shield size={12} />} label="Elitism" value={params.elitism}
            min={0} max={4} step={1}
            onChange={(v) => updateParams({ elitism: v })} />
        </div>
      </Card>

      {/* Transport Controls */}
      <Card icon={<Play size={14} className="text-dna-green" />} title="Controls">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onPlay} disabled={playing || state.converged}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-dna-green text-white hover:bg-dna-green/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Play size={14} /> Play
          </button>
          <button onClick={onPause} disabled={!playing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-surface-500 text-text-primary hover:bg-surface-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Pause size={14} /> Pause
          </button>
          <button onClick={onStep} disabled={playing || state.converged}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-dna-blue text-white hover:bg-dna-blue/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <SkipForward size={14} /> Step
          </button>
          <button onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-dna-rose text-white hover:bg-dna-rose/80 transition-all">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted flex items-center gap-1"><Gauge size={12} /> Speed</span>
            <span className="font-bold text-text-primary">{SPEED_LABELS[speed]}</span>
          </div>
          <input type="range" min={1} max={5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-dna-blue h-1.5 rounded-full appearance-none bg-surface-500 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dna-blue [&::-webkit-slider-thumb]:shadow-lg" />
        </div>
      </Card>

      {/* Stats */}
      <Card icon={<Sparkles size={14} className="text-dna-violet" />} title="Statistics">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Best Fitness" value={best} color="dna-green" />
          <StatBox label="Avg Fitness" value={avg} color="dna-violet" />
          <StatBox label="Generation" value={state.generation} color="dna-pink" />
          <StatBox label="Diversity" value={diversity === '—' ? '—' : `${diversity}%`} color="dna-cyan" />
        </div>
        {bestChr && (
          <div className="mt-2 p-2 rounded-lg bg-surface-700/50">
            <div className="text-[11px] text-text-muted mb-0.5">Best Chromosome</div>
            <div className="font-mono text-sm font-bold text-dna-green break-all">
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
    <div className="bg-surface-800 border border-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Slider({ icon, label, value, min, max, step, format, onChange, disabled }) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted font-medium flex items-center gap-1">{icon} {label}</span>
        <span className="font-bold text-text-primary font-mono">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-surface-500 cursor-pointer accent-dna-blue
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dna-blue" />
    </div>
  );
}

const STAT_COLOR_MAP = {
  'dna-green': { bg: 'bg-dna-green/10', text: 'text-dna-green' },
  'dna-violet': { bg: 'bg-dna-violet/10', text: 'text-dna-violet' },
  'dna-pink': { bg: 'bg-dna-pink/10', text: 'text-dna-pink' },
  'dna-cyan': { bg: 'bg-dna-cyan/10', text: 'text-dna-cyan' },
};

function StatBox({ label, value, color }) {
  const c = STAT_COLOR_MAP[color] || { bg: 'bg-surface-700/50', text: 'text-text-primary' };
  return (
    <div className={`text-center p-2 rounded-lg ${c.bg}`}>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className={`text-lg font-extrabold ${c.text}`}>{value}</div>
    </div>
  );
}

function Sparkles({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
    </svg>
  );
}
