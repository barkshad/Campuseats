
import React, { useState, useEffect } from 'react';
import { AppView, UserPreferences } from './types';
import Dashboard from './components/Dashboard';
import VoiceAgent from './components/VoiceAgent';
import ChatBot from './components/ChatBot';
import MealPlanner from './components/MealPlanner';
import VisionAssistant from './components/VisionAssistant';
import { Mic, MessageSquare, Utensils, Camera, LayoutGrid, Settings, Key } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 200,
    location: 'Nairobi, Kenya',
    cookingAccess: 'kettle',
    dietary: 'None'
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Proceed assuming success per race condition guidelines
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center p-3 transition-all duration-300 ${
        activeView === view ? 'text-orange-600 scale-110' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={22} strokeWidth={activeView === view ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-sm">CE</div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">CampusEats AI</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Student Fuel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasKey && (
            <button 
              onClick={handleSelectKey}
              className="p-2 text-orange-600 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors"
              title="Unlock Pro Features"
            >
              <Key size={18} />
            </button>
          )}
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/50">
        {activeView === AppView.DASHBOARD && <Dashboard preferences={preferences} setPreferences={setPreferences} />}
        {activeView === AppView.VOICE && <VoiceAgent preferences={preferences} />}
        {activeView === AppView.CHAT && <ChatBot preferences={preferences} />}
        {activeView === AppView.PLANNER && <MealPlanner preferences={preferences} />}
        {activeView === AppView.VISION && <VisionAssistant />}
      </main>

      {/* Navigation */}
      <nav className="bg-white border-t border-slate-100 flex justify-around items-center px-2 py-2 sticky bottom-0 safe-bottom shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <NavItem view={AppView.DASHBOARD} icon={LayoutGrid} label="Home" />
        <NavItem view={AppView.CHAT} icon={MessageSquare} label="Chat" />
        <button 
          onClick={() => setActiveView(AppView.VOICE)}
          className={`-mt-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all duration-500 transform ${
            activeView === AppView.VOICE 
              ? 'bg-orange-600 text-white scale-110 rotate-0' 
              : 'bg-white text-orange-600 hover:scale-105'
          }`}
        >
          <Mic size={32} />
        </button>
        <NavItem view={AppView.PLANNER} icon={Utensils} label="Planner" />
        <NavItem view={AppView.VISION} icon={Camera} label="Scan" />
      </nav>
    </div>
  );
};

export default App;
