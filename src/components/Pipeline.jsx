const PIPELINE_STEPS = [
  { id: 'init', num: '①', label: 'Initialize' },
  { id: 'eval', num: '②', label: 'Evaluate' },
  { id: 'select', num: '③', label: 'Select' },
  { id: 'cross', num: '④', label: 'Crossover' },
  { id: 'mutate', num: '⑤', label: 'Mutate' },
  { id: 'replace', num: '⑥', label: 'Replace' },
];

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
    <div className="bg-white border border-orange-200 shadow-sm shadow-orange-100/50 rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-3">GA Pipeline</h3>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = step.id === completedStepId;
          const isPast = completedStepId && PIPELINE_STEPS.findIndex(s => s.id === completedStepId) > i;

          let styleCls = 'bg-orange-50/50 text-stone-400 border border-orange-100';
          if (isActive) {
            styleCls = 'bg-orange-500 text-white font-bold scale-105 shadow-sm shadow-orange-500/30 ring-2 ring-orange-300';
          } else if (isPast) {
            styleCls = 'bg-orange-100 text-orange-900 border border-orange-200 font-medium';
          }

          return (
            <div key={step.id} className="flex items-center gap-1.5">
              <div
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs
                  transition-all duration-300 ${styleCls}
                `}
              >
                <span>{step.num}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className="text-orange-300 text-sm mx-0.5">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
