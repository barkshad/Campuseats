
import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../types';
import { TrendingDown, MapPin, Wrench, Wallet, Lightbulb, ChevronRight, PieChart } from 'lucide-react';

interface DashboardProps {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ preferences, setPreferences }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Buying Githeri from the local vendor is 30% cheaper than supermarkets.",
    "Eggs are your cheapest high-protein source this month.",
    "Try bulk-buying Ndengu (green grams) at the weekend market.",
    "End-of-day fruit stands often offer half-price deals."
  ];

  useEffect(() => {
    const timer = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 8000);
    return () => clearInterval(timer);
  }, [tips.length]);

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* Budget Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Daily Allowance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">KSh {preferences.budget}</span>
            </div>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <Wallet size={24} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-sm font-medium">Safe Zone</span>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold bg-white text-orange-600 px-4 py-2 rounded-full hover:bg-orange-50 transition-colors shadow-lg">
            Details <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-orange-200 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MapPin size={24} />
          </div>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Campus Hub</h3>
          <p className="text-slate-900 font-bold truncate text-sm">{preferences.location}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-orange-200 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wrench size={24} />
          </div>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Kitchen Setup</h3>
          <p className="text-slate-900 font-bold capitalize text-sm">{preferences.cookingAccess}</p>
        </div>
      </div>

      {/* Smart Tip */}
      <div className="bg-blue-600 rounded-[2rem] p-5 text-white flex items-start gap-4 shadow-lg shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-20">
          <PieChart size={64} />
        </div>
        <div className="p-2 bg-white/20 rounded-xl shrink-0">
          <Lightbulb size={20} className="text-blue-100" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Smart Savings</h4>
          <p className="text-sm font-medium leading-relaxed animate-fade-in">{tips[tipIndex]}</p>
        </div>
      </div>

      {/* Live Recommendations */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown size={20} className="text-orange-500" />
            Today's Best Value
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Updates Live</span>
        </div>
        <div className="space-y-3">
          {[
            { meal: "Githeri + Avocado", price: "KSh 120", source: "Market Vendor", health: "High Protein" },
            { meal: "2 Eggs + 3 Chapatis", price: "KSh 100", source: "Campus Shack", health: "Energy Pick" },
            { meal: "Lentil Soup + Rice", price: "KSh 150", source: "Dorm Cook", health: "Balanced" }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white rounded-[1.5rem] border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group cursor-pointer">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{item.meal}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">{item.source}</span>
                  <span className="text-[10px] text-green-600 font-bold">{item.health}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
