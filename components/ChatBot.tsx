
import React, { useState, useRef, useEffect } from 'react';
import { UserPreferences } from '../types';
import { gemini } from '../services/geminiService';
import { Send, Loader2, ExternalLink } from 'lucide-react';

interface ChatBotProps {
  preferences: UserPreferences;
}

const ChatBot: React.FC<ChatBotProps> = ({ preferences }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string, sources?: any[] }>>([
    { role: 'ai', content: "Hi! I'm CampusEats AI. Tell me your budget for the next meal, and I'll find you the best spots near your campus." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await gemini.getMealAdvice(userMsg, preferences);
      const text = response.text || "I'm having trouble finding recommendations right now.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      setMessages(prev => [...prev, { role: 'ai', content: text, sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I ran into an error. Please check your internet and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user' 
                ? 'bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-100' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Sources & Locations</p>
                  {m.sources.map((s: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={s.web?.uri || s.maps?.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline"
                    >
                      <ExternalLink size={10} />
                      {s.web?.title || s.maps?.title || "View Source"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin text-orange-500" size={18} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-1 border border-slate-200">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a meal or budget..."
            className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-colors ${
              input.trim() && !isLoading ? 'bg-orange-600 text-white' : 'text-slate-300'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
