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
  noir: { card: 'bg-zinc-950 border-white/5', gradient: 'from-zinc-900 via-zinc-950 to-black', text: 'text-white', subtext: 'text-zinc-500', accent: 'bg-white/10' },
  crimson: { card: 'bg-rose-950/20 border-rose-500/20', gradient: 'from-rose-500 via-pink-600 to-rose-900', text: 'text-white', subtext: 'text-white/70', accent: 'bg-white/20' },
  ocean: { card: 'bg-blue-950/20 border-blue-500/20', gradient: 'from-blue-400 via-indigo-600 to-blue-900', text: 'text-white', subtext: 'text-white/70', accent: 'bg-white/20' },
  aurora: { card: 'bg-emerald-950/20 border-emerald-500/20', gradient: 'from-emerald-400 via-teal-500 to-emerald-900', text: 'text-white', subtext: 'text-white/70', accent: 'bg-white/20' },
  sunset: { card: 'bg-orange-950/20 border-orange-500/20', gradient: 'from-orange-400 via-pink-500 to-rose-600', text: 'text-white', subtext: 'text-white/70', accent: 'bg-white/20' },
  nebula: { card: 'bg-purple-950/20 border-purple-500/20', gradient: 'from-violet-400 via-purple-600 to-indigo-900', text: 'text-white', subtext: 'text-white/70', accent: 'bg-white/20' },
  midnight: { card: 'bg-slate-950 border-slate-800', gradient: 'from-slate-800 via-slate-950 to-black', text: 'text-white', subtext: 'text-slate-500', accent: 'bg-white/10' }
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
    if (selectedQuestion) setModalTheme(selectedQuestion.theme || 'noir');
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
        contents: `I received this anonymous question: "${selectedQuestion.text}". Give me a short, witty reply.`,
        config: { systemInstruction: "Witty social media personality. Short, sharp, engaging.", temperature: 0.9 }
      });
      if (response.text) setAnswerText(response.text.trim());
    } catch (err) {
      console.error("AI failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete whisper?")) return;
    try {
        await deleteQuestion(id);
        setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e) {
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
      const dataUrl = await toPng(captureRef.current, { cacheBust: true, pixelRatio: 3, width: 1080, height: 1920 });
      const link = document.createElement('a');
      link.download = `Studio-Whisper-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed export', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-pink-500" size={32} /></div>;

  return (
    <div className="w-full space-y-10">
      <header className="px-1 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">Inbox</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-bold mt-2 opacity-80">
                Unread whispers: <span className="text-pink-500 font-black">{questions.length}</span>
              </p>
           </div>
           {questions.length > 0 && (
             <button onClick={copyLink} className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all">
               {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} Share Link
             </button>
           )}
      </header>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 dark:bg-zinc-900/20 backdrop-blur-3xl border border-zinc-100 dark:border-white/5 rounded-[48px] p-20 text-center flex flex-col items-center max-w-3xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-8 shadow-inner"><MessageSquare size={36} /></div>
          <h3 className="text-3xl font-black mb-4 dark:text-white tracking-tight">The portal is quiet.</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg font-bold leading-relaxed max-w-sm">Invite whispers into your studio by sharing your unique link.</p>
          <button onClick={copyLink} className="w-full sm:w-auto bg-pink-500 text-white px-12 py-5 rounded-[28px] font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all">
            {copied ? <Check size={24} strokeWidth={3} /> : <Copy size={24} strokeWidth={3} />} {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {questions.map((q, i) => {
             const styles = THEME_STYLES[q.theme || 'noir'] || THEME_STYLES['noir'];
             return (
              <motion.div 
                key={q.id} 
                initial={{ scale: 0.98, opacity: 0, y: 15 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.03 }} 
                onClick={() => setSelectedQuestion(q)} 
                className={clsx(
                  "border p-8 rounded-[40px] cursor-pointer group transition-all relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 min-h-[260px] flex flex-col justify-between", 
                  styles.card
                )}
              >
                <div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-1.5 border border-white/10">
                            <Shield size={12} className="text-pink-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">SECRET</span>
                        </div>
                        <button onClick={(e) => handleDelete(e, q.id)} className="p-2 rounded-full hover:bg-red-500/20 text-white/30 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>
                    <p className={clsx("text-xl font-black leading-tight line-clamp-3 tracking-tighter", styles.text)}>{q.text}</p>
                </div>
                <div className="mt-8 flex justify-between items-center relative z-10">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-white">{timeAgo(q.timestamp)}</span>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-full border bg-white/10 text-white border-white/20 backdrop-blur-3xl group-hover:bg-pink-500 transition-all">Reply</span>
                </div>
                <div className={clsx("absolute inset-0 opacity-[0.05] bg-gradient-to-br", styles.gradient)}></div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[40px]" onClick={() => setSelectedQuestion(null)}/>
            <motion.div 
              initial={{ scale: 0.98, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.98, y: 20, opacity: 0 }} 
              className="w-full max-w-5xl h-[85dvh] flex flex-col lg:flex-row bg-white dark:bg-zinc-900 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl relative z-10"
            >
              <button onClick={() => setSelectedQuestion(null)} className="absolute top-6 right-6 z-50 text-zinc-400 hover:text-white bg-zinc-100 dark:bg-white/5 rounded-full p-3 transition-all"><X size={24} /></button>
              
              <div className="flex-[0.8] bg-zinc-50 dark:bg-[#0c0c0e] relative flex flex-col items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-white/5">
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl px-6 py-3 rounded-[24px] border border-white/10 shadow-lg scale-90 md:scale-100">
                    <Palette size={16} className="text-pink-500" />
                    <div className="flex gap-2">
                      {Object.keys(THEME_STYLES).map((t) => (
                        <button key={t} onClick={() => setModalTheme(t)} className={clsx("w-6 h-6 rounded-full border-2 transition-all hover:scale-110 bg-gradient-to-br", THEME_STYLES[t].gradient, modalTheme === t ? 'border-pink-500 ring-4 ring-pink-500/10' : 'border-white/20 opacity-60')} />
                      ))}
                    </div>
                 </div>

                 <div className="relative shadow-2xl rounded-[40px] overflow-hidden" style={{ height: '420px', aspectRatio: '9/16' }}>
                    <div className={clsx("w-full h-full flex flex-col items-center justify-center relative p-8 text-center bg-gradient-to-br transition-all duration-700", THEME_STYLES[modalTheme].gradient)}>
                         <div className="relative z-10 bg-white/10 backdrop-blur-[40px] border border-white/30 p-8 rounded-[36px] shadow-2xl w-full rotate-1">
                             <p className={clsx("font-black text-2xl leading-tight tracking-tighter", THEME_STYLES[modalTheme].text)}>{selectedQuestion.text}</p>
                         </div>
                    </div>
                 </div>

                 <div className="mt-8 z-20 w-full max-w-[200px]">
                     <button onClick={handleDownloadImage} disabled={downloading} className="w-full bg-zinc-950 dark:bg-white dark:text-black text-white text-xs font-black px-6 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                       {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} strokeWidth={3} />} {downloading ? 'Preparing...' : 'Export Asset'}
                    </button>
                 </div>
              </div>

              <div className="flex-1 bg-white dark:bg-zinc-900 p-8 lg:p-16 flex flex-col justify-center overflow-y-auto no-scrollbar">
                 <div className="max-w-md mx-auto w-full">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                          <h3 className="text-3xl font-black mb-2 dark:text-white tracking-tighter leading-none">Post Reply</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold opacity-80">Broadcast this to your portal feed.</p>
                        </div>
                        <button onClick={handleAISuggest} disabled={aiLoading} className="p-4 bg-pink-500/10 text-pink-500 rounded-2xl hover:scale-110 transition-all border border-pink-500/5">
                            {aiLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                        </button>
                    </div>
                    
                    <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Whisper your reply..." autoFocus className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[32px] p-8 text-zinc-900 dark:text-white outline-none resize-none text-xl font-black min-h-[160px] focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 transition-all shadow-inner leading-tight mb-8" />

                    <div className="bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 p-6 rounded-[28px] mb-8 flex items-center justify-between group cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                        <div className="flex items-center gap-4">
                          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md", isPublic ? "bg-pink-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-zinc-500")}><Eye size={20} /></div>
                          <div>
                            <p className="text-sm font-black dark:text-white leading-none mb-1">Public Feed</p>
                            <p className="text-[10px] font-bold text-zinc-500">Show in your portal</p>
                          </div>
                        </div>
                        <div className={clsx("relative w-12 h-6 rounded-full transition-all p-1", isPublic ? "bg-pink-500" : "bg-zinc-300 dark:bg-white/10")}>
                          <motion.div animate={{ x: isPublic ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-md"/>
                        </div>
                    </div>

                    <button onClick={handlePublish} disabled={!answerText.trim() || publishing} className="w-full bg-pink-500 text-white font-black text-xl py-6 rounded-[28px] shadow-[0_20px_40px_rgba(236,72,153,0.3)] hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50">
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