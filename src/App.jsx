import { useState } from 'react';
import useGAEngine from './hooks/useGAEngine';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import ExplanationPanel from './components/ExplanationPanel';
import Pipeline from './components/Pipeline';
import PopulationView from './components/PopulationView';
import FitnessChart from './components/FitnessChart';
import GenePoolHeatmap from './components/GenePoolHeatmap';
import DiversityChart from './components/DiversityChart';
import TextbookCheck from './components/TextbookCheck';
import InfoTooltip from './components/InfoTooltip';
import { Users, TrendingUp, Flame, Activity, BookOpen } from 'lucide-react';

const TABS = [
  {
    id: 'population',
    label: 'Population',
    icon: Users,
    align: 'left',
    title: 'Population Column',
    tooltip: 'Displays every chromosome in the current generation with gene-level breakdown, fitness scores, selection status (parents), crossover points, and mutations.',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: TrendingUp,
    align: 'left',
    title: 'Fitness Column',
    tooltip: 'Live chart plotting Best, Average, and Worst fitness across generations to track convergence, evolutionary fitness gain, and population progress.',
  },
  {
    id: 'heatmap',
    label: 'Gene Pool',
    icon: Flame,
    align: 'center',
    title: 'Gene Pool Column',
    tooltip: 'Real-time heatmap showing allele frequency distribution across all chromosome positions (loci) to inspect genetic drift and locus convergence.',
  },
  {
    id: 'diversity',
    label: 'Diversity',
    icon: Activity,
    align: 'right',
    title: 'Diversity Column',
    tooltip: 'Monitors the percentage of unique chromosomes in the population over time to diagnose premature convergence and balance exploration vs. exploitation.',
  },
  {
    id: 'textbook',
    label: 'Textbook',
    icon: BookOpen,
    align: 'right',
    title: 'Textbook Column',
    tooltip: 'Interactive step-by-step verification of David E. Goldberg\'s classic (1989) f(x) = x² hand calculation with verified arithmetic at every step.',
  },
];

export default function App() {
  const {
    state, params, playing, speed, setSpeed,
    timeRemaining, totalTime,
    step, play, pause, reset, updateParams,
  } = useGAEngine();

  const [activeTab, setActiveTab] = useState('population');

  return (
    <div className="min-h-screen bg-[#fffaf5] text-stone-900">
      <Header generation={state.generation} phase={state.phase} converged={state.converged} />

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-5 flex flex-col lg:flex-row gap-5">
        {/* Left Panel */}
        <ControlPanel
          params={params}
          updateParams={updateParams}
          playing={playing}
          speed={speed}
          setSpeed={setSpeed}
          timeRemaining={timeRemaining}
          totalTime={totalTime}
          onPlay={play}
          onPause={pause}
          onStep={step}
          onReset={reset}
          state={state}
        />

        {/* Main Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Explanation */}
          <ExplanationPanel stepLog={state.stepLog} />

          {/* Tabs */}
          <div>
            <div className="flex flex-wrap sm:flex-nowrap gap-1 px-1 overflow-visible py-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-t-lg text-xs font-semibold
                      transition-all whitespace-nowrap cursor-pointer relative
                      ${isActive
                        ? 'bg-white text-orange-600 border border-orange-200 border-b-white font-bold shadow-sm'
                        : 'text-stone-500 hover:text-orange-600 hover:bg-orange-50 bg-transparent border border-transparent'
                      }
                    `}
                  >
                    <Icon size={14} className={isActive ? 'text-orange-600' : 'text-stone-400'} />
                    <span>{tab.label}</span>
                    <InfoTooltip
                      title={tab.title}
                      text={tab.tooltip}
                      align={tab.align}
                      position="top"
                    />
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-orange-200 shadow-sm shadow-orange-100/50 rounded-b-xl rounded-tr-xl p-5 min-h-[420px]">
              {activeTab === 'population' && (
                <PopulationView state={state} params={params} />
              )}
              {activeTab === 'fitness' && (
                <FitnessChart history={state.history} />
              )}
              {activeTab === 'heatmap' && (
                <GenePoolHeatmap population={state.population} params={params} />
              )}
              {activeTab === 'diversity' && (
                <DiversityChart history={state.history} />
              )}
              {activeTab === 'textbook' && (
                <TextbookCheck />
              )}
            </div>
          </div>

          {/* Pipeline */}
          <Pipeline phase={state.phase} />
        </main>
      </div>
    </div>
  );
}
