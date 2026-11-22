const PHASE_COLORS = {
  blue: { border: 'border-l-dna-blue', bg: 'bg-dna-blue/5' },
  emerald: { border: 'border-l-dna-emerald', bg: 'bg-dna-emerald/5' },
  amber: { border: 'border-l-dna-amber', bg: 'bg-dna-amber/5' },
  pink: { border: 'border-l-dna-pink', bg: 'bg-dna-pink/5' },
  rose: { border: 'border-l-dna-rose', bg: 'bg-dna-rose/5' },
  violet: { border: 'border-l-dna-violet', bg: 'bg-dna-violet/5' },
};

export default function ExplanationPanel({ stepLog }) {
  if (!stepLog) {
    return (
      <div className="bg-surface-800 border border-border rounded-xl p-5 border-l-4 border-l-dna-blue">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📘</span>
          <h3 className="text-base font-bold">Welcome to Darwin Labs</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Genetic Algorithms mimic natural evolution to solve optimization problems.
          A <b className="text-dna-blue">population</b> of candidate solutions
          (<b className="text-dna-green">chromosomes</b>) evolves through{' '}
          <b className="text-dna-amber">selection</b>,{' '}
          <b className="text-dna-pink">crossover</b>, and{' '}
          <b className="text-dna-rose">mutation</b>. Select a problem, tune
          parameters, and press <b>Step</b> or <b>Play</b> to begin!
        </p>
      </div>
    );
  }

  const colors = PHASE_COLORS[stepLog.phaseColor] || PHASE_COLORS.blue;

  return (
    <div className={`bg-surface-800 border border-border rounded-xl p-5 border-l-4 ${colors.border} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{stepLog.icon}</span>
        <h3 className="text-base font-bold">{stepLog.title}</h3>
      </div>
      <p
        className="text-sm text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: stepLog.text }}
      />
      {stepLog.details && (
        <pre className={`mt-3 p-3 rounded-lg ${colors.bg} font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-text-secondary max-h-40 overflow-y-auto`}>
          {stepLog.details}
        </pre>
      )}
    </div>
  );
}
