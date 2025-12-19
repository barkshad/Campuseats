
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
import { createBlob, decode, decodeAudioData, encode } from '../services/audioUtils';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Loader2, Sparkles, X, Volume2 } from 'lucide-react';

interface VoiceAgentProps {
  preferences: UserPreferences;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ preferences }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const toggleSession = async () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            sessionRef.current = { scriptProcessor, stream };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setAiResponse(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription('');
              setAiResponse('');
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            stopSession();
          },
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `You are CampusEats AI. Respond very concisely. Helping with KSh ${preferences.budget} at ${preferences.location}. Use search if needed for prices.`,
        }
      });
    } catch (err) {
      console.error('Mic access denied:', err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.scriptProcessor?.disconnect();
      sessionRef.current.stream?.getTracks().forEach((t: any) => t.stop());
    }
    setIsActive(false);
    setIsConnecting(false);
    setTranscription('');
    setAiResponse('');
  };

  return (
    <div className="flex flex-col items-center h-full p-8 text-center bg-slate-50 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-100/30 to-transparent pointer-events-none" />

      {/* Close Button if Active */}
      {isActive && (
        <button 
          onClick={stopSession}
          className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all z-20"
        >
          <X size={20} />
        </button>
      )}

      {/* The Animated Orb Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative z-10">
        <div className="mb-12 relative group">
          {/* Animated rings */}
          {isActive && (
            <>
              <div className="absolute -inset-16 bg-orange-400/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -inset-8 bg-orange-500/10 rounded-full blur-xl animate-ping duration-[3000ms]" />
              <div className="absolute -inset-2 bg-gradient-to-tr from-orange-600 to-amber-400 rounded-full blur-md opacity-30 animate-spin-slow" />
            </>
          )}
          
          <button
            onClick={toggleSession}
            disabled={isConnecting}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-90 ${
              isActive 
                ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white ring-8 ring-orange-500/20' 
                : 'bg-white text-orange-600 hover:shadow-orange-100'
            }`}
          >
            {isConnecting ? (
              <Loader2 size={56} className="animate-spin" />
            ) : isActive ? (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-12 bg-white rounded-full animate-wave-1" />
                <div className="w-1.5 h-8 bg-white/80 rounded-full animate-wave-2" />
                <div className="w-1.5 h-14 bg-white rounded-full animate-wave-3" />
                <div className="w-1.5 h-10 bg-white/80 rounded-full animate-wave-4" />
              </div>
            ) : (
              <Mic size={56} className="group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        <div className="space-y-4 w-full">
          <h2 className={`text-2xl font-black transition-colors duration-500 ${isActive ? 'text-orange-600' : 'text-slate-800'}`}>
            {isActive ? "CampusEats Listening" : "Start Food Assistant"}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            {isActive 
              ? "Tell me what you're craving or your exact budget." 
              : "Voice command enabled. Ask about cheap meals, grocery deals, or calorie counts."}
          </p>

          <div className={`mt-8 transition-all duration-500 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-orange-100/50 border border-orange-50 min-h-[140px] flex flex-col justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-5">
                 <Volume2 size={48} className="text-orange-600" />
               </div>
               
              {transcription && (
                <div className="text-left mb-3">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">User Input</p>
                   <p className="text-slate-600 text-sm italic font-medium">"{transcription}"</p>
                </div>
              )}
              
              {aiResponse ? (
                <div className="text-left animate-fade-in">
                  <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Response</p>
                  <p className="text-orange-600 font-bold text-base leading-snug">
                    <Sparkles size={16} className="inline mr-2 mb-1" />
                    {aiResponse}
                  </p>
                </div>
              ) : (
                isActive && !transcription && (
                  <div className="flex gap-1.5 justify-center items-center h-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="w-1.5 bg-orange-200 rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.2); }
        }
        .animate-wave-1 { animation: wave 1s ease-in-out infinite; }
        .animate-wave-2 { animation: wave 1.2s ease-in-out infinite 0.1s; }
        .animate-wave-3 { animation: wave 0.8s ease-in-out infinite 0.2s; }
        .animate-wave-4 { animation: wave 1.1s ease-in-out infinite 0.3s; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
      `}} />

      <div className="mt-auto grid grid-cols-2 gap-4 w-full">
        <div className="p-4 bg-white rounded-3xl border border-slate-100 text-left shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Budget</p>
          <p className="text-slate-900 font-black">KSh {preferences.budget}</p>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-slate-100 text-left shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Cooking</p>
          <p className="text-slate-900 font-black capitalize">{preferences.cookingAccess}</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
