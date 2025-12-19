
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
import { createBlob, decode, decodeAudioData, encode } from '../services/audioUtils';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Loader2, Sparkles, X, Volume2, AlertCircle } from 'lucide-react';

interface VoiceAgentProps {
  preferences: UserPreferences;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ preferences }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscription('');
    setAiResponse('');

    try {
      // 1. Initialize Audio Contexts
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Resume context (browser security policy)
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            // Setup Microphone Streaming
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Always use the promise to send input
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
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

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) {
                try { s.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setError("Connection error. Please try again.");
            stopSession();
          },
          onclose: () => {
            console.log('Session closed');
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are CampusEats AI. Helping a student with budget KSh ${preferences.budget} at ${preferences.location}. Kitchen: ${preferences.cookingAccess}. Be concise, friendly, and practical.`,
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      setError("Microphone access denied or connection failed.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    // 1. Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // 2. Disconnect processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    // 3. Stop all playing audio
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsActive(false);
    setIsConnecting(false);
  };

  const toggleSession = () => {
    if (isActive) stopSession();
    else startSession();
  };

  return (
    <div className="flex flex-col items-center h-full p-8 text-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className={`absolute -top-20 -left-20 w-64 h-64 bg-orange-100 rounded-full blur-3xl transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-0'}`} />
      <div className={`absolute -bottom-20 -right-20 w-64 h-64 bg-amber-100 rounded-full blur-3xl transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-0'}`} />

      {/* Close Button */}
      {isActive && (
        <button 
          onClick={stopSession}
          className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-xl z-20 transition-all active:scale-90"
        >
          <X size={20} />
        </button>
      )}

      {/* Main UI */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative z-10">
        <div className="mb-10 relative">
          {/* Animated Rings */}
          {isActive && (
            <div className="absolute inset-0 -m-8">
              <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-2 border-2 border-orange-400 rounded-full animate-spin-slow opacity-30" />
            </div>
          )}
          
          <button
            onClick={toggleSession}
            disabled={isConnecting}
            className={`relative w-44 h-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 active:scale-90 ${
              isActive 
                ? 'bg-gradient-to-br from-orange-500 to-orange-700 scale-105' 
                : 'bg-white hover:shadow-orange-100 scale-100'
            }`}
          >
            {isConnecting ? (
              <Loader2 size={64} className="text-orange-500 animate-spin" />
            ) : isActive ? (
              <div className="flex items-center gap-1.5 h-16">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-white rounded-full animate-voice-bar" 
                    style={{ animationDelay: `${i * 0.15}s` }} 
                  />
                ))}
              </div>
            ) : (
              <Mic size={64} className="text-orange-600" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className={`text-2xl font-black transition-colors duration-500 ${isActive ? 'text-orange-600' : 'text-slate-800'}`}>
            {isActive ? "CampusEats is Live" : "Food Assistant"}
          </h2>
          <p className="text-slate-500 text-sm font-medium px-4">
            {isActive 
              ? "I'm listening to your meal requests..." 
              : "Tap the mic to get instant budget-friendly meal advice using your voice."}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-bold border border-red-100 animate-fade-in">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Real-time Feedback UI */}
          <div className={`mt-8 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-orange-100 border border-white min-h-[160px] flex flex-col justify-center text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Volume2 size={48} className="text-orange-600" />
              </div>

              {transcription && (
                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Thinking...</span>
                  <p className="text-slate-600 text-sm font-medium italic">"{transcription}"</p>
                </div>
              )}
              
              {aiResponse ? (
                <div className="animate-fade-in">
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest block mb-1">CampusEats AI</span>
                  <p className="text-slate-900 font-bold text-lg leading-snug">
                    <Sparkles size={18} className="inline mr-2 text-orange-400 mb-1" />
                    {aiResponse}
                  </p>
                </div>
              ) : isActive && !transcription && (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting input</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes voice-bar {
          0%, 100% { height: 16px; }
          50% { height: 48px; }
        }
        .animate-voice-bar { animation: voice-bar 0.8s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 12s linear infinite; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Footer Stats */}
      <div className="mt-auto grid grid-cols-2 gap-4 w-full relative z-10">
        <div className="p-5 bg-white rounded-[2rem] border border-slate-100 text-left shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Limit</p>
          <p className="text-slate-900 font-black text-base">KSh {preferences.budget}</p>
        </div>
        <div className="p-5 bg-white rounded-[2rem] border border-slate-100 text-left shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Loc</p>
          <p className="text-slate-900 font-black text-base truncate">{preferences.location.split(',')[0]}</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
