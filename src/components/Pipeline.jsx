const PIPELINE_STEPS = [
  { id: 'init', num: '①', label: 'Initialize', color: 'dna-blue', phase: 'idle' },
  { id: 'eval', num: '②', label: 'Evaluate', color: 'dna-green', phase: 'evaluate' },
  { id: 'select', num: '③', label: 'Select', color: 'dna-amber', phase: 'select' },
  { id: 'cross', num: '④', label: 'Crossover', color: 'dna-pink', phase: 'crossover' },
  { id: 'mutate', num: '⑤', label: 'Mutate', color: 'dna-rose', phase: 'mutate' },
  { id: 'replace', num: '⑥', label: 'Replace', color: 'dna-violet', phase: 'replace' },
];

// Map the state phase to the active pipeline step
function getActiveStep(phase) {
  if (phase === 'idle') return 'init';
  if (phase === 'evaluate') return 'eval';
  if (phase === 'select') return 'select';
  if (phase === 'crossover') return 'cross';
  if (phase === 'mutate') return 'mutate';
  if (phase === 'replace') return 'replace';
  return 'init';
}

const STEP_THEMES = {
  'dna-blue': {
    active: 'bg-dna-blue/25 text-dna-blue scale-110 shadow-lg shadow-dna-blue/20 ring-1 ring-dna-blue/40',
    past: 'bg-dna-blue/10 text-dna-blue/70',
  },
  'dna-green': {
    active: 'bg-dna-green/25 text-dna-green scale-110 shadow-lg shadow-dna-green/20 ring-1 ring-dna-green/40',
    past: 'bg-dna-green/10 text-dna-green/70',
  },
  'dna-amber': {
    active: 'bg-dna-amber/25 text-dna-amber scale-110 shadow-lg shadow-dna-amber/20 ring-1 ring-dna-amber/40',
    past: 'bg-dna-amber/10 text-dna-amber/70',
  },
  'dna-pink': {
    active: 'bg-dna-pink/25 text-dna-pink scale-110 shadow-lg shadow-dna-pink/20 ring-1 ring-dna-pink/40',
    past: 'bg-dna-pink/10 text-dna-pink/70',
  },
  'dna-rose': {
    active: 'bg-dna-rose/25 text-dna-rose scale-110 shadow-lg shadow-dna-rose/20 ring-1 ring-dna-rose/40',
    past: 'bg-dna-rose/10 text-dna-rose/70',
  },
  'dna-violet': {
    active: 'bg-dna-violet/25 text-dna-violet scale-110 shadow-lg shadow-dna-violet/20 ring-1 ring-dna-violet/40',
    past: 'bg-dna-violet/10 text-dna-violet/70',
  },
};

export default function Pipeline({ phase }) {
  const justCompleted = {
    idle: null,
    evaluate: 'init',
    select: 'eval',
    crossover: 'select',
    mutate: 'cross',
    replace: 'mutate',
  };

  const completedStepId = justCompleted[phase];

  return (
    <div className="bg-surface-800 border border-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">GA Pipeline</h3>
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = step.id === completedStepId;
          const isPast = completedStepId && PIPELINE_STEPS.findIndex(s => s.id === completedStepId) > i;
          const theme = STEP_THEMES[step.color];
          const styleCls = isActive
            ? theme.active
            : isPast
              ? theme.past
              : 'bg-surface-700/50 text-text-muted';

          return (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                  transition-all duration-300 ${styleCls}
                `}
              >
                <span>{step.num}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className="text-text-muted text-sm mx-0.5">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
