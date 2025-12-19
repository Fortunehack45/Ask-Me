
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInboxQuestions, publishAnswer, deleteQuestion } from '../services/db';
import { Question } from '../types';
import { Loader2, MessageSquare, X, Shield, Check, Copy, Download, Trash2, Lock, Eye, Sparkles, Palette } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, copyToClipboard } from '../utils';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";
import clsx from 'clsx';

const THEME_STYLES: Record<string, { card: string, gradient: string, text: string, subtext: string, accent: string }> = {
  noir: {
    card: 'bg-zinc-950 border-zinc-800 hover:border-pink-500/40',
    gradient: 'from-zinc-900 via-zinc-950 to-black',
    text: 'text-white',
    subtext: 'text-zinc-500',
    accent: 'bg-white/10'
  },
  crimson: {
    card: 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500',
    gradient: 'from-rose-500 via-pink-600 to-rose-900',
    text: 'text-white',
    subtext: 'text-white/70',
    accent: 'bg-white/20'
  },
  ocean: {
    card: 'bg-blue-950/30 border-blue-500/30 hover:border-blue-500',
    gradient: 'from-blue-400 via-indigo-600 to-blue-900',
    text: 'text-white',
    subtext: 'text-white/70',
    accent: 'bg-white/20'
  },
  aurora: {
    card: 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500',
    gradient: 'from-emerald-400 via-teal-500 to-emerald-900',
    text: 'text-white',
    subtext: 'text-white/70',
    accent: 'bg-white/20'
  },
  sunset: {
    card: 'bg-orange-950/30 border-orange-500/30 hover:border-orange-500',
    gradient: 'from-orange-400 via-pink-500 to-rose-600',
    text: 'text-white',
    subtext: 'text-white/70',
    accent: 'bg-white/20'
  },
  nebula: {
    card: 'bg-purple-950/30 border-purple-500/30 hover:border-purple-500',
    gradient: 'from-violet-400 via-purple-600 to-indigo-900',
    text: 'text-white',
    subtext: 'text-white/70',
    accent: 'bg-white/20'
  },
  lemonade: {
    card: 'bg-yellow-950/30 border-yellow-500/30 hover:border-yellow-500',
    gradient: 'from-yellow-300 via-orange-400 to-amber-600',
    text: 'text-zinc-900',
    subtext: 'text-zinc-900/60',
    accent: 'bg-black/10'
  },
  midnight: {
    card: 'bg-slate-950 border-slate-800 hover:border-blue-500/40',
    gradient: 'from-slate-800 via-slate-950 to-black',
    text: 'text-white',
    subtext: 'text-slate-500',
    accent: 'bg-white/10'
  }
};

const Inbox = () => {
  const { user, userProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [modalTheme, setModalTheme] = useState('noir');
  const [answerText, setAnswerText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const loadInbox = async () => {
      const msgs = await getInboxQuestions(user.uid);
      setQuestions(msgs);
      setLoading(false);
    };
    loadInbox();
  }, [user]);

  useEffect(() => {
    if (selectedQuestion) {
      setModalTheme(selectedQuestion.theme || 'noir');
    }
  }, [selectedQuestion]);

  const handlePublish = async () => {
    if (!selectedQuestion || !answerText.trim()) return;
    setPublishing(true);
    try {
      await publishAnswer(selectedQuestion, answerText, userProfile, isPublic);
      setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id));
      setSelectedQuestion(null);
      setAnswerText('');
      setIsPublic(false);
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  const handleAISuggest = async () => {
    if (!selectedQuestion) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I received this anonymous question: "${selectedQuestion.text}". Give me a short, witty reply to post on my story. Just the text.`,
        config: {
          systemInstruction: "You are a witty social media personality. Keep answers under 15 words.",
          temperature: 0.8,
        }
      });
      if (response.text) {
        setAnswerText(response.text.trim());
      }
    } catch (err) {
      console.error("AI failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this question forever?")) return;
    try {
        await deleteQuestion(id);
        setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e: any) {
        console.error("Delete error:", e);
    }
  };

  const copyLink = async () => {
    if(!userProfile) return;
    const url = `${window.location.origin}/#/u/${userProfile.username}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, 
        backgroundColor: 'transparent',
        width: 1080,
        height: 1920
      });
      const link = document.createElement('a');
      link.download = `AskMe-Studio-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-pink-500" size={32} /></div>;

  return (
    <div className="w-full">
      {/* PERFECT DOWNLOAD ENGINE: Hidden fixed-res capture layer */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
          {selectedQuestion && (
            <div ref={captureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).gradient)}>
                 <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                 <div className="absolute top-24 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-[32px] bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                      <Shield size={48} className="text-white" />
                    </div>
                    <span className="text-white font-black uppercase tracking-[0.5em] text-lg">Anonymous Question</span>
                 </div>
                 <div className="relative z-10 bg-white/10 backdrop-blur-[60px] border border-white/30 p-20 rounded-[80px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full rotate-2">
                     <p className={clsx("font-black text-6xl leading-tight tracking-tight drop-shadow-2xl", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).text)}>
                        {selectedQuestion.text}
                     </p>
                 </div>
                 <div className="absolute bottom-24 flex flex-col items-center gap-8">
                     <p className="text-xl text-white/50 uppercase tracking-[0.4em] font-black">Tap to reply</p>
                     <div className="bg-black/30 backdrop-blur-3xl px-12 py-6 rounded-full border border-white/10 shadow-2xl">
                        <p className="text-white font-black text-3xl tracking-tight">
                          askme.app<span className="text-white/40">/u/{userProfile?.username}</span>
                        </p>
                     </div>
                 </div>
            </div>
          )}
      </div>

      <header className="mb-8 px-1">
           <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter">Inbox</h1>
           <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium mt-1">
             You have <span className="text-pink-600 dark:text-pink-500 font-bold">{questions.length}</span> unread whispers
           </p>
      </header>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-16 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
          <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mb-8 text-white shadow-xl relative">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-3xl font-black mb-4 dark:text-white">Your inbox is empty</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg font-medium leading-relaxed max-w-sm">Share your profile link on Instagram or Snapchat to receive secret questions!</p>
          <button onClick={copyLink} className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black px-12 py-5 rounded-[20px] font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-105 transition-all">
            {copied ? <Check size={24} /> : <Copy size={24} />}
            {copied ? 'Link Copied!' : 'Copy My Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {questions.map((q, i) => {
             const styles = THEME_STYLES[q.theme || 'noir'] || THEME_STYLES['noir'];
             return (
              <motion.div 
                key={q.id} 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }} 
                onClick={() => setSelectedQuestion(q)} 
                className={clsx(
                  "border p-8 rounded-[36px] cursor-pointer group transition-all relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 min-h-[280px] flex flex-col justify-between", 
                  styles.card
                )}
              >
                <div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 bg-black/20 rounded-full px-3.5 py-1.5 border border-white/10">
                            <Shield size={12} className="text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Secret</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={clsx("text-[10px] font-bold uppercase opacity-60", styles.text)}>{timeAgo(q.timestamp)}</span>
                            <button onClick={(e) => handleDelete(e, q.id)} className="p-2 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all active:scale-90"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <p className={clsx("text-2xl font-black leading-tight line-clamp-4 tracking-tight", styles.text)}>{q.text}</p>
                </div>
                <div className="mt-8 flex justify-end relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full border bg-white/10 text-white border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-all">Reply</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal logic remains identical but UI is simplified */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl" onClick={() => setSelectedQuestion(null)}/>
            <motion.div 
              initial={{ scale: 0.95, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.95, y: 50, opacity: 0 }} 
              className="w-full max-w-6xl h-[92vh] flex flex-col lg:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl relative z-10"
            >
              <button onClick={() => setSelectedQuestion(null)} className="absolute top-8 right-8 z-50 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full p-2.5 transition-all active:scale-90"><X size={24} /></button>
              
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800">
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <Palette size={18} className="text-pink-500" />
                    <div className="flex gap-2.5">
                      {Object.keys(THEME_STYLES).map((t) => (
                        <button key={t} onClick={() => setModalTheme(t)} className={clsx("w-6 h-6 rounded-full border-2 transition-all hover:scale-125 bg-gradient-to-br", THEME_STYLES[t].gradient, modalTheme === t ? 'border-pink-500 ring-4 ring-pink-500/10' : 'border-white/20 opacity-70')} />
                      ))}
                    </div>
                 </div>

                 <div className="relative shadow-2xl rounded-[40px] overflow-hidden" style={{ height: '520px', aspectRatio: '9/16' }}>
                    <div className={clsx("w-full h-full flex flex-col items-center justify-center relative p-10 text-center bg-gradient-to-br transition-all duration-700", THEME_STYLES[modalTheme].gradient)}>
                         <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                         <div className="absolute top-10 flex flex-col items-center gap-3 opacity-90">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-2xl flex items-center justify-center border border-white/20 shadow-xl"><Shield size={20} className="text-white" /></div>
                            <span className="text-white font-black uppercase tracking-[0.4em] text-[8px]">Secret Whisper</span>
                         </div>
                         <div className="relative z-10 bg-white/10 backdrop-blur-[30px] border border-white/30 p-10 rounded-[36px] shadow-2xl w-full rotate-2">
                             <p className={clsx("font-black text-2xl leading-tight tracking-tight drop-shadow-2xl", THEME_STYLES[modalTheme].text)}>
                                {selectedQuestion.text}
                             </p>
                         </div>
                    </div>
                 </div>

                 <div className="mt-8 z-20 w-full max-w-xs">
                     <button onClick={handleDownloadImage} disabled={downloading} className="w-full bg-zinc-900 dark:bg-white dark:text-black text-white text-base font-black px-8 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                       {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                       {downloading ? 'Preparing...' : 'Download Post'}
                    </button>
                 </div>
              </div>

              <div className="flex-1 bg-white dark:bg-zinc-900 p-10 lg:p-16 flex flex-col justify-center overflow-y-auto no-scrollbar">
                 <div className="max-w-md mx-auto w-full">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                          <h3 className="text-4xl font-black mb-2 dark:text-white tracking-tighter">Post Reply</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Add this to your public feed.</p>
                        </div>
                        <button onClick={handleAISuggest} disabled={aiLoading} className="p-4 bg-pink-500/10 text-pink-600 rounded-2xl hover:scale-110 active:rotate-12 transition-all">
                            {aiLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                        </button>
                    </div>
                    
                    <div className="relative mb-8">
                        <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Type your answer..." autoFocus className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 text-zinc-900 dark:text-white outline-none resize-none text-xl font-bold min-h-[180px] focus:ring-4 focus:ring-pink-500/10 transition-all placeholder-zinc-300 shadow-inner" />
                        <div className="absolute bottom-6 right-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{answerText.length} / 500</div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[24px] mb-10 flex items-center justify-between group cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                        <div className="flex items-center gap-4">
                          <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isPublic ? "bg-pink-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}>
                            {isPublic ? <Eye size={24} /> : <Lock size={24} />}
                          </div>
                          <div>
                            <p className="font-black dark:text-white">Public Feed</p>
                            <p className="text-xs font-medium text-zinc-500">Feature on your profile</p>
                          </div>
                        </div>
                        <div className={clsx("relative w-14 h-7 rounded-full transition-all p-1", isPublic ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-700")}>
                          <motion.div animate={{ x: isPublic ? 28 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-md"/>
                        </div>
                    </div>

                    <button onClick={handlePublish} disabled={!answerText.trim() || publishing} className="w-full bg-pink-600 text-white font-black text-xl py-6 rounded-[24px] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all">
                        {publishing ? <Loader2 className="animate-spin" size={24} /> : 'Publish Whisper'}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inbox;
