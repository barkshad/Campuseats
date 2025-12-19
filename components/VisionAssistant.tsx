
import React, { useState } from 'react';
import { gemini } from '../services/geminiService';
import { Camera, Upload, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const VisionAssistant: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setLoading(true);
    try {
      const result = await gemini.analyzeFoodImage(base64, "Identify the food, estimate its cost for a student, and suggest a cheaper alternative.");
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Could not analyze this image. Please try another one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-800">Scan & Save</h2>
        <p className="text-sm text-slate-500">Scan a meal, grocery item, or receipt to check if you're overpaying.</p>
      </div>

      <div className="relative">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
          id="camera-input" 
        />
        <label 
          htmlFor="camera-input"
          className="flex flex-col items-center justify-center w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group"
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-orange-500 transition-colors">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Camera size={32} />
              </div>
              <span className="text-sm font-semibold">Tap to Take Photo or Upload</span>
            </div>
          )}
        </label>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="animate-spin text-orange-600" size={32} />
          <p className="text-sm font-medium text-slate-500">CampusEats AI is analyzing...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
            <Sparkles size={16} />
            AI Breakdown
          </div>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {analysis}
          </div>
          <button 
            onClick={() => {setImage(null); setAnalysis(null);}}
            className="w-full py-3 bg-slate-50 text-slate-600 font-semibold rounded-2xl text-sm border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            Scan Another
          </button>
        </div>
      )}

      {!image && !loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <CheckCircle2 size={16} className="text-orange-500 mb-2" />
            <h4 className="text-xs font-bold text-orange-900 mb-1">Price Check</h4>
            <p className="text-[10px] text-orange-700">Scan restaurant menus to find the cheapest options.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <CheckCircle2 size={16} className="text-blue-500 mb-2" />
            <h4 className="text-xs font-bold text-blue-900 mb-1">Receipt Analysis</h4>
            <p className="text-[10px] text-blue-700">Track your grocery spending by scanning receipts.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionAssistant;
