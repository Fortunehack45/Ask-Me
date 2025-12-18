
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInboxQuestions, publishAnswer, saveFCMToken, deleteQuestion } from '../services/db';
import { getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { Question } from '../types';
import { Loader2, MessageSquare, Share2, X, Shield, Check, Copy, Download, Bell, Trash2, Lock, Eye, Sparkles, Palette } from '../components/Icons';
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
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [enablingNotifs, setEnablingNotifs] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

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
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Small delay to ensure styles are applied
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 4, 
        backgroundColor: 'transparent' 
      });
      const link = document.createElement('a');
      link.download = `AskMe-Story-${Date.now()}.png`;
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
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Inbox</h1>
           <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium mt-1">
             <span className="text-pink-600 dark:text-pink-500 font-bold">{questions.length}</span> secret messages
           </p>
        </div>
      </header>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-6 text-white shadow-xl">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-3xl font-black mb-2 dark:text-white">Your inbox is empty</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto font-medium">Share your link on Instagram or Snapchat to start receiving anonymous questions!</p>
          <button onClick={copyLink} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all">
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? 'Link Copied!' : 'Copy My Profile Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  "border p-8 rounded-[32px] cursor-pointer group transition-all relative overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1.5 min-h-[280px] flex flex-col justify-between", 
                  styles.card
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 bg-black/20 rounded-full px-3.5 py-1.5 border border-white/10 backdrop-blur-md">
                            <Shield size={12} className="text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Secret</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={clsx("text-[10px] font-bold uppercase tracking-tighter opacity-60", styles.text)}>{timeAgo(q.timestamp)}</span>
                            <button onClick={(e) => handleDelete(e, q.id)} className="p-2 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all active:scale-90"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <p className={clsx("text-2xl font-black leading-tight line-clamp-4 tracking-tight", styles.text)}>{q.text}</p>
                </div>
                <div className="mt-6 flex justify-end relative z-10">
                   <span className="text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl border bg-white/10 text-white border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-all">Reply</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-2xl" onClick={() => setSelectedQuestion(null)}/>
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 50, opacity: 0 }} 
              className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10"
            >
              <button onClick={() => setSelectedQuestion(null)} className="absolute top-6 right-6 z-50 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full p-2.5 transition-all active:scale-90"><X size={24} /></button>
              
              {/* Asset Preview Panel */}
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 relative flex flex-col items-center justify-center p-8 overflow-hidden">
                 {/* Visual Palette UI */}
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white dark:bg-zinc-900 px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                    <Palette size={18} className="text-pink-500" />
                    <div className="flex gap-2.5">
                      {Object.keys(THEME_STYLES).map((t) => (
                        <button
                          key={t}
                          onClick={() => setModalTheme(t)}
                          className={clsx(
                            "w-7 h-7 rounded-full border-2 transition-all hover:scale-125 active:scale-90 bg-gradient-to-br",
                            THEME_STYLES[t].gradient,
                            modalTheme === t ? 'border-pink-500 ring-4 ring-pink-500/10 scale-125 shadow-xl' : 'border-white/20 opacity-70'
                          )}
                        />
                      ))}
                    </div>
                 </div>

                 <div className="relative shadow-[0_40px_100px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden" style={{ height: '580px', aspectRatio: '9/16' }}>
                    <div ref={cardRef} className={clsx("w-full h-full flex flex-col items-center justify-center relative p-10 text-center transition-all duration-700 ease-in-out bg-gradient-to-br", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).gradient)}>
                         {/* High-end micro-noise texture */}
                         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                         
                         {/* Premium Watermark Branding */}
                         <div className="absolute top-14 flex flex-col items-center gap-3 opacity-90">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                              <Shield size={24} className="text-white" />
                            </div>
                            <span className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Anonymous Message</span>
                         </div>

                         {/* The Floating Question Card */}
                         <div className="relative z-10 bg-white/10 backdrop-blur-3xl border border-white/30 p-10 rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] w-full rotate-1 group">
                             <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 rounded-[36px]"></div>
                             <p className={clsx("font-black text-3xl leading-tight break-words tracking-tight drop-shadow-2xl relative z-10", THEME_STYLES[modalTheme].text)}>
                                {selectedQuestion.text}
                             </p>
                         </div>

                         {/* Share Details Footer */}
                         <div className="absolute bottom-16 flex flex-col items-center gap-4">
                             <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">Tap to reply</p>
                             <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                                <p className="text-white font-black text-sm tracking-tight">
                                  askme.app<span className="text-white/40 font-medium">/u/{userProfile?.username}</span>
                                </p>
                             </div>
                         </div>
                    </div>
                 </div>

                 <div className="mt-8 z-20">
                     <button 
                        onClick={handleDownloadImage} 
                        disabled={downloading} 
                        className="bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 text-zinc-900 text-base font-black px-10 py-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                     >
                       {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                       {downloading ? 'Preparing...' : 'Download for Instagram'}
                    </button>
                 </div>
              </div>

              {/* Reply Form Panel */}
              <div className="flex-1 bg-white dark:bg-zinc-900 p-8 lg:p-16 flex flex-col justify-center">
                 <div className="max-w-md mx-auto w-full">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                          <h3 className="text-4xl font-black mb-2 dark:text-white tracking-tight">Post Reply</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Your reply will be public on your feed.</p>
                        </div>
                        <button 
                          onClick={handleAISuggest} 
                          disabled={aiLoading} 
                          title="AI Sparkle Reply"
                          className="p-4 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-2xl transition-all hover:scale-110 active:rotate-12 border border-pink-500/10 hover:shadow-xl hover:shadow-pink-500/10"
                        >
                            {aiLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                        </button>
                    </div>
                    
                    <div className="relative mb-8">
                        <textarea 
                          value={answerText} 
                          onChange={(e) => setAnswerText(e.target.value)} 
                          placeholder="What's your answer?" 
                          autoFocus 
                          className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 text-zinc-900 dark:text-white outline-none resize-none text-2xl font-bold min-h-[200px] focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 transition-all placeholder-zinc-300 dark:placeholder-zinc-700" 
                        />
                        <div className="absolute bottom-6 right-8 text-xs font-black text-zinc-400 uppercase tracking-widest">{answerText.length} / 500</div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] mb-10 flex items-center justify-between group cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                        <div className="flex items-center gap-5">
                          <div className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all", 
                            isPublic ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                          )}>
                            {isPublic ? <Eye size={24} strokeWidth={2.5} /> : <Lock size={24} />}
                          </div>
                          <div>
                            <p className="text-base font-black dark:text-white">Public Feed</p>
                            <p className="text-xs font-medium text-zinc-500">Show this answer on your profile</p>
                          </div>
                        </div>
                        <div className={clsx("relative w-14 h-7 rounded-full transition-colors p-1", isPublic ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-700")}>
                          <motion.div animate={{ x: isPublic ? 28 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-md"/>
                        </div>
                    </div>

                    <button 
                      onClick={handlePublish} 
                      disabled={!answerText.trim() || publishing} 
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-2xl py-6 rounded-[24px] shadow-2xl disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                        {publishing ? <Loader2 className="animate-spin" /> : 'Post to Feed'}
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
