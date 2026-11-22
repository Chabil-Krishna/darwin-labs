import { useState } from 'react';
import useGAEngine from './hooks/useGAEngine';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import ExplanationPanel from './components/ExplanationPanel';
import Pipeline from './components/Pipeline';
import PopulationView from './components/PopulationView';
import FitnessChart from './components/FitnessChart';
import GenePoolHeatmap from './components/GenePoolHeatmap';
import GenealogyView from './components/GenealogyView';
import DiversityChart from './components/DiversityChart';
import TextbookCheck from './components/TextbookCheck';
import { Users, TrendingUp, Flame, GitBranch, Activity, BookOpen } from 'lucide-react';

const TABS = [
  { id: 'population', label: 'Population', icon: Users },
  { id: 'fitness', label: 'Fitness', icon: TrendingUp },
  { id: 'heatmap', label: 'Gene Pool', icon: Flame },
  { id: 'genealogy', label: 'Genealogy', icon: GitBranch },
  { id: 'diversity', label: 'Diversity', icon: Activity },
  { id: 'textbook', label: 'Textbook', icon: BookOpen },
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
      <Header generation={state.generation} phase={state.phase} />

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
            <div className="flex gap-1 px-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-xs font-semibold
                      transition-all whitespace-nowrap cursor-pointer
                      ${isActive
                        ? 'bg-white text-orange-600 border border-orange-200 border-b-white font-bold shadow-sm'
                        : 'text-stone-500 hover:text-orange-600 hover:bg-orange-50 bg-transparent border border-transparent'
                      }
                    `}
                  >
                    <Icon size={14} className={isActive ? 'text-orange-600' : 'text-stone-400'} />
                    {tab.label}
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
              {activeTab === 'genealogy' && (
                <GenealogyView genealogy={state.genealogy} history={state.history} params={params} />
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
