
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { gemini } from '../services/geminiService';
import { Calendar, DollarSign, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';

interface MealPlannerProps {
  preferences: UserPreferences;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ preferences }) => {
  const [loading, setLoading] = useState(false);
  const [visuals, setVisuals] = useState<Record<string, string>>({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const plan = [
    { day: 'Monday', meal: 'Oatmeal & Banana', cost: 40 },
    { day: 'Tuesday', meal: 'Bean Stew & Rice', cost: 120 },
    { day: 'Wednesday', meal: 'Egg Curry & Chapati', cost: 100 },
    { day: 'Thursday', meal: 'Kale & Ugali', cost: 60 },
    { day: 'Friday', meal: 'Grilled Fish (Treat)', cost: 250 },
  ];

  const generateImage = async (meal: string) => {
    setLoading(true);
    try {
      const url = await gemini.generateMealVisual(meal);
      if (url) setVisuals(prev => ({ ...prev, [meal]: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = plan.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Weekly Save Plan</h2>
        <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
          <DollarSign size={12} />
          Total: KSh {totalCost}
        </div>
      </div>

      <div className="space-y-4">
        {plan.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="flex p-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{item.day}</p>
                  <h4 className="font-semibold text-slate-800">{item.meal}</h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">KSh {item.cost}</p>
                <button 
                  onClick={() => generateImage(item.meal)}
                  className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5 hover:underline"
                >
                  <Sparkles size={10} />
                  See it
                </button>
              </div>
            </div>
            
            {visuals[item.meal] && (
              <div className="px-4 pb-4">
                <img 
                  src={visuals[item.meal]} 
                  alt={item.meal} 
                  className="w-full h-32 object-cover rounded-xl border border-slate-100"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-slate-100">
            <Loader2 className="animate-spin text-orange-600" size={32} />
            <p className="text-sm font-semibold text-slate-600">Visualizing your meal...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
