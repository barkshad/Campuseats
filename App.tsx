
import React, { useState, useEffect } from 'react';
import { AppView, UserPreferences } from './types';
import Dashboard from './components/Dashboard';
import VoiceAgent from './components/VoiceAgent';
import ChatBot from './components/ChatBot';
import MealPlanner from './components/MealPlanner';
import VisionAssistant from './components/VisionAssistant';
import { Mic, MessageSquare, Utensils, Camera, LayoutGrid, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 200,
    location: 'Nairobi, Kenya',
    cookingAccess: 'kettle',
    dietary: 'None'
  });

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center p-3 transition-colors ${
        activeView === view ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={24} />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-orange-600">CampusEats AI</h1>
          <p className="text-xs text-slate-500">Student Food Assistant</p>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {activeView === AppView.DASHBOARD && <Dashboard preferences={preferences} setPreferences={setPreferences} />}
        {activeView === AppView.VOICE && <VoiceAgent preferences={preferences} />}
        {activeView === AppView.CHAT && <ChatBot preferences={preferences} />}
        {activeView === AppView.PLANNER && <MealPlanner preferences={preferences} />}
        {activeView === AppView.VISION && <VisionAssistant />}
      </main>

      {/* Navigation */}
      <nav className="bg-white border-t border-slate-100 flex justify-around items-center px-2 py-1 sticky bottom-0">
        <NavItem view={AppView.DASHBOARD} icon={LayoutGrid} label="Home" />
        <NavItem view={AppView.CHAT} icon={MessageSquare} label="Chat" />
        <button 
          onClick={() => setActiveView(AppView.VOICE)}
          className={`-mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
            activeView === AppView.VOICE 
              ? 'bg-orange-600 text-white scale-110' 
              : 'bg-white text-orange-600 hover:bg-orange-50'
          }`}
        >
          <Mic size={28} />
        </button>
        <NavItem view={AppView.PLANNER} icon={Utensils} label="Planner" />
        <NavItem view={AppView.VISION} icon={Camera} label="Scan" />
      </nav>
    </div>
  );
};

export default App;
