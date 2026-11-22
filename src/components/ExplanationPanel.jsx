export default function ExplanationPanel({ stepLog }) {
  if (!stepLog) {
    return (
      <div className="bg-white border border-orange-200 rounded-xl p-5 border-l-4 border-l-orange-500 shadow-sm shadow-orange-100/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📘</span>
          <h3 className="text-base font-bold text-stone-900">Welcome to Darwin Labs</h3>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          Genetic Algorithms mimic natural evolution to solve optimization problems.
          A <b className="text-orange-600 font-semibold">population</b> of candidate solutions
          (<b className="text-orange-600 font-semibold">chromosomes</b>) evolves through{' '}
          <b className="text-orange-600 font-semibold">selection</b>,{' '}
          <b className="text-orange-600 font-semibold">crossover</b>, and{' '}
          <b className="text-orange-600 font-semibold">mutation</b>. Select a problem, tune
          parameters, and press <b>Step</b> or <b>Play</b> to begin!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-orange-200 rounded-xl p-5 border-l-4 border-l-orange-500 shadow-sm shadow-orange-100/50 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{stepLog.icon}</span>
        <h3 className="text-base font-bold text-stone-900">{stepLog.title}</h3>
      </div>
      <p
        className="text-sm text-stone-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: stepLog.text }}
      />
      {stepLog.details && (
        <pre className="mt-3 p-3.5 rounded-lg bg-orange-50/80 border border-orange-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-stone-800 max-h-44 overflow-y-auto">
          {stepLog.details}
        </pre>
      )}
    </div>
  );
}
