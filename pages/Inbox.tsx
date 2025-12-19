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

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-pink-500" size={48} /></div>;

  return (
    <div className="w-full space-y-12">
      <header className="px-1 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter">Inbox</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-2xl font-bold mt-2">
                Unread whispers: <span className="text-pink-500 font-black">{questions.length}</span>
              </p>
           </div>
           {questions.length > 0 && (
             <button onClick={copyLink} className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all active:scale-95">
               {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
               Share My Link
             </button>
           )}
      </header>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 dark:bg-zinc-900/20 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-[64px] p-24 text-center flex flex-col items-center max-w-4xl mx-auto shadow-sm">
          <div className="w-28 h-28 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-10 shadow-inner">
            <MessageSquare size={48} />
          </div>
          <h3 className="text-4xl font-black mb-6 dark:text-white tracking-tight">The portal is quiet.</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-12 text-2xl font-bold leading-relaxed max-w-lg">Invite whispers into your studio by sharing your unique link.</p>
          <button onClick={copyLink} className="w-full sm:w-auto bg-pink-500 text-white px-16 py-7 rounded-[32px] font-black text-2xl flex items-center justify-center gap-5 shadow-[0_24px_48px_rgba(236,72,153,0.3)] hover:scale-110 transition-all active:scale-95">
            {copied ? <Check size={28} strokeWidth={3} /> : <Copy size={28} strokeWidth={3} />}
            {copied ? 'Link Copied!' : 'Copy My Studio Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {questions.map((q, i) => {
             const styles = THEME_STYLES[q.theme || 'noir'] || THEME_STYLES['noir'];
             return (
              <motion.div 
                key={q.id} 
                initial={{ scale: 0.95, opacity: 0, y: 30 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }} 
                onClick={() => setSelectedQuestion(q)} 
                className={clsx(
                  "border p-10 rounded-[48px] cursor-pointer group transition-all relative overflow-hidden shadow-sm hover:shadow-2xl hover:border-pink-500/20 min-h-[320px] flex flex-col justify-between", 
                  styles.card
                )}
              >
                <div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl rounded-full px-5 py-2 border border-white/10">
                            <Shield size={14} className="text-pink-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">SECRET</span>
                        </div>
                        <button onClick={(e) => handleDelete(e, q.id)} className="p-2.5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-500 transition-all active:scale-90 opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                    </div>
                    <p className={clsx("text-3xl font-black leading-[1.15] line-clamp-4 tracking-tighter", styles.text)}>{q.text}</p>
                </div>
                <div className="mt-10 flex justify-between items-center relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-white">{timeAgo(q.timestamp)}</span>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] px-8 py-3.5 rounded-full border bg-white/10 text-white border-white/20 backdrop-blur-3xl group-hover:bg-pink-500 group-hover:border-pink-500 transition-all">Reply</span>
                </div>
                <div className={clsx("absolute inset-0 opacity-[0.05] bg-gradient-to-br", styles.gradient)}></div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* REFINED MODAL EXPERIENCE */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[40px]" onClick={() => setSelectedQuestion(null)}/>
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 50, opacity: 0 }} 
              className="w-full max-w-[1400px] h-[90dvh] flex flex-col lg:flex-row bg-white dark:bg-zinc-900 border border-white/10 rounded-[64px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.5)] relative z-10"
            >
              <button onClick={() => setSelectedQuestion(null)} className="absolute top-10 right-10 z-50 text-zinc-400 hover:text-white bg-zinc-100 dark:bg-white/5 rounded-full p-4 transition-all active:scale-90"><X size={32} /></button>
              
              <div className="flex-1 bg-zinc-50 dark:bg-[#0c0c0e] relative flex flex-col items-center justify-center p-10 lg:p-20 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                 <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl px-8 py-4 rounded-[28px] border border-white/10 shadow-2xl">
                    <Palette size={20} className="text-pink-500" />
                    <div className="flex gap-3">
                      {Object.keys(THEME_STYLES).map((t) => (
                        <button key={t} onClick={() => setModalTheme(t)} className={clsx("w-8 h-8 rounded-full border-4 transition-all hover:scale-125 bg-gradient-to-br", THEME_STYLES[t].gradient, modalTheme === t ? 'border-pink-500 ring-[10px] ring-pink-500/10' : 'border-white/20 opacity-60')} />
                      ))}
                    </div>
                 </div>

                 <div className="relative shadow-[0_80px_160px_-40px_rgba(0,0,0,0.6)] rounded-[56px] overflow-hidden" style={{ height: '540px', aspectRatio: '9/16' }}>
                    <div className={clsx("w-full h-full flex flex-col items-center justify-center relative p-12 text-center bg-gradient-to-br transition-all duration-1000", THEME_STYLES[modalTheme].gradient)}>
                         <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                         <div className="absolute top-12 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl"><Shield size={24} className="text-white" /></div>
                            <span className="text-white font-black uppercase tracking-[0.5em] text-[10px] opacity-60">Secret Whisper</span>
                         </div>
                         <div className="relative z-10 bg-white/10 backdrop-blur-[40px] border border-white/30 p-12 rounded-[48px] shadow-2xl w-full rotate-2">
                             <p className={clsx("font-black text-3xl leading-tight tracking-tighter drop-shadow-2xl", THEME_STYLES[modalTheme].text)}>
                                {selectedQuestion.text}
                             </p>
                         </div>
                    </div>
                 </div>

                 <div className="mt-12 z-20 w-full max-w-xs">
                     <button onClick={handleDownloadImage} disabled={downloading} className="w-full bg-zinc-950 dark:bg-white dark:text-black text-white text-lg font-black px-10 py-5 rounded-[28px] shadow-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all">
                       {downloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} strokeWidth={3} />}
                       {downloading ? 'Preparing...' : 'Export Asset'}
                    </button>
                 </div>
              </div>

              <div className="flex-1 bg-white dark:bg-zinc-900 p-12 lg:p-24 flex flex-col justify-center overflow-y-auto no-scrollbar">
                 <div className="max-w-lg mx-auto w-full">
                    <div className="flex items-start justify-between mb-12">
                        <div>
                          <h3 className="text-5xl font-black mb-3 dark:text-white tracking-tighter leading-none">Post Reply</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-bold tracking-tight">Broadcast this to your public studio feed.</p>
                        </div>
                        <button onClick={handleAISuggest} disabled={aiLoading} className="p-5 bg-pink-500/10 text-pink-500 rounded-[28px] hover:scale-110 active:rotate-12 transition-all shadow-lg border border-pink-500/5">
                            {aiLoading ? <Loader2 className="animate-spin" size={32} /> : <Sparkles size={32} />}
                        </button>
                    </div>
                    
                    <div className="relative mb-12">
                        <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Whisper your reply..." autoFocus className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 text-zinc-900 dark:text-white outline-none resize-none text-3xl font-black min-h-[220px] focus:ring-[16px] focus:ring-pink-500/5 focus:border-pink-500 transition-all placeholder-zinc-300 dark:placeholder-white/5 shadow-inner leading-tight" />
                        <div className="absolute bottom-8 right-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{answerText.length} / 500</div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#070708] border border-zinc-200 dark:border-white/5 p-8 rounded-[36px] mb-12 flex items-center justify-between group cursor-pointer hover:border-pink-500/30 transition-all" onClick={() => setIsPublic(!isPublic)}>
                        <div className="flex items-center gap-5">
                          <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg", isPublic ? "bg-pink-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-zinc-500")}>
                            {isPublic ? <Eye size={28} /> : <Lock size={28} />}
                          </div>
                          <div>
                            <p className="text-xl font-black dark:text-white leading-none mb-1.5">Public Feed</p>
                            <p className="text-sm font-bold text-zinc-500">Feature this in your portal</p>
                          </div>
                        </div>
                        <div className={clsx("relative w-16 h-8 rounded-full transition-all p-1.5", isPublic ? "bg-pink-500" : "bg-zinc-300 dark:bg-white/10")}>
                          <motion.div animate={{ x: isPublic ? 32 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-2xl"/>
                        </div>
                    </div>

                    <button onClick={handlePublish} disabled={!answerText.trim() || publishing} className="w-full bg-pink-500 text-white font-black text-2xl py-8 rounded-[36px] shadow-[0_32px_64px_rgba(236,72,153,0.3)] hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50">
                        {publishing ? <Loader2 className="animate-spin" size={32} /> : 'Publish Whisper'}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIDDEN CAPTURE LAYER FOR HIGH-RES EXPORT */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
          {selectedQuestion && (
            <div ref={captureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).gradient)}>
                 <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                 <div className="absolute top-24 flex flex-col items-center gap-10">
                    <div className="w-32 h-32 rounded-[40px] bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                      <Shield size={64} className="text-white" />
                    </div>
                    <span className="text-white font-black uppercase tracking-[0.6em] text-3xl opacity-60">Secret Whisper</span>
                 </div>
                 <div className="relative z-10 bg-white/10 backdrop-blur-[60px] border border-white/30 p-24 rounded-[100px] shadow-[0_60px_120px_rgba(0,0,0,0.4)] w-full rotate-2">
                     <p className={clsx("font-black text-7xl leading-[1.1] tracking-tighter drop-shadow-2xl", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).text)}>
                        {selectedQuestion.text}
                     </p>
                 </div>
                 <div className="absolute bottom-24 flex flex-col items-center gap-10">
                     <p className="text-2xl text-white/40 uppercase tracking-[0.6em] font-black">Tap to reply</p>
                     <div className="bg-black/40 backdrop-blur-3xl px-16 py-8 rounded-full border border-white/10 shadow-2xl">
                        <p className="text-white font-black text-4xl tracking-tighter uppercase">
                          askme.app<span className="text-white/40">/u/{userProfile?.username}</span>
                        </p>
                     </div>
                 </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Inbox;