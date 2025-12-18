
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

const THEME_STYLES: Record<string, { card: string, gradient: string, text: string, subtext: string }> = {
  noir: {
    card: 'bg-zinc-950 border-zinc-800 hover:border-pink-500/40',
    gradient: 'bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black',
    text: 'text-white',
    subtext: 'text-zinc-400'
  },
  crimson: {
    card: 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500',
    gradient: 'bg-gradient-to-bl from-rose-600 via-rose-500 to-red-900',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  ocean: {
    card: 'bg-blue-950/30 border-blue-500/30 hover:border-blue-500',
    gradient: 'bg-gradient-to-bl from-blue-600 via-indigo-600 to-blue-900',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  aurora: {
    card: 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500',
    gradient: 'bg-gradient-to-bl from-emerald-400 via-teal-500 to-cyan-900',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  sunset: {
    card: 'bg-orange-950/30 border-orange-500/30 hover:border-orange-500',
    gradient: 'bg-gradient-to-bl from-orange-500 via-pink-600 to-rose-700',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  nebula: {
    card: 'bg-purple-950/30 border-purple-500/30 hover:border-purple-500',
    gradient: 'bg-gradient-to-bl from-violet-500 via-purple-600 to-indigo-900',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  lemonade: {
    card: 'bg-yellow-950/30 border-yellow-500/30 hover:border-yellow-500',
    gradient: 'bg-gradient-to-bl from-yellow-300 via-orange-400 to-amber-700',
    text: 'text-zinc-900',
    subtext: 'text-zinc-900/70'
  },
  midnight: {
    card: 'bg-slate-950 border-slate-800 hover:border-blue-500/40',
    gradient: 'bg-gradient-to-bl from-slate-900 via-slate-950 to-black',
    text: 'text-white',
    subtext: 'text-slate-400'
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

  const enableNotifications = async () => {
    setEnablingNotifs(true);
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const vapidKey = 'REPLACE_WITH_YOUR_VAPID_KEY';
        if (vapidKey === 'REPLACE_WITH_YOUR_VAPID_KEY') {
             setEnablingNotifs(false);
             return;
        }
        const token = await getToken(messaging, { vapidKey });
        if (token && userProfile) {
          await saveFCMToken(userProfile.uid, token);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEnablingNotifs(false);
    }
  };

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
        alert(`Failed to delete: ${e.message || 'Unknown error'}`);
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
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: 'transparent' });
      const link = document.createElement('a');
      link.download = `askme-story-${Date.now()}.png`;
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
             <span className="text-pink-600 dark:text-pink-500 font-bold">{questions.length}</span> questions waiting
           </p>
        </div>
      </header>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-400 shadow-inner">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-2">It's quiet...</h3>
          <p className="text-zinc-500 mb-8 max-w-xs mx-auto">Share your link to get questions!</p>
          <button onClick={copyLink} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all">
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Link Copied!' : 'Copy Profile Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {questions.map((q, i) => {
             const styles = THEME_STYLES[q.theme || 'noir'] || THEME_STYLES['noir'];
             return (
              <motion.div key={q.id} initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedQuestion(q)} className={clsx("border p-8 rounded-[32px] cursor-pointer group transition-all relative overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 min-h-[260px] flex flex-col justify-between", styles.card)}>
                <div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
                            <Shield size={12} className="text-white/70" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Anon</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={clsx("text-[10px] font-medium opacity-60", styles.text)}>{timeAgo(q.timestamp)}</span>
                            <button onClick={(e) => handleDelete(e, q.id)} className="p-1.5 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                    <p className={clsx("text-2xl font-bold leading-snug line-clamp-4", styles.text)}>{q.text}</p>
                </div>
                <div className="mt-6 flex justify-end relative z-10">
                   <span className="text-xs font-bold px-4 py-2 rounded-full border bg-black/20 text-white border-white/20">Reply <Share2 size={12} /></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl" onClick={() => setSelectedQuestion(null)}/>
            <motion.div initial={{ scale: 0.95, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 50, opacity: 0 }} className="w-full max-w-5xl h-[90vh] md:h-[80vh] flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl relative z-10">
              <button onClick={() => setSelectedQuestion(null)} className="absolute top-4 right-4 z-50 text-zinc-500 hover:text-zinc-900 bg-white/50 rounded-full p-2 backdrop-blur-md"><X size={24} /></button>
              
              <div className="flex-1 bg-zinc-100 dark:bg-black/50 relative flex flex-col items-center justify-center p-8 overflow-hidden">
                 {/* Premium Theme Selector UI */}
                 <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <Palette size={16} className="text-pink-500" />
                    <div className="flex gap-2">
                      {Object.keys(THEME_STYLES).map((t) => (
                        <button
                          key={t}
                          onClick={() => setModalTheme(t)}
                          className={clsx(
                            "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-90",
                            THEME_STYLES[t].gradient,
                            modalTheme === t ? 'border-pink-500 ring-2 ring-pink-500/20 scale-125 shadow-lg' : 'border-white/10 opacity-70'
                          )}
                        />
                      ))}
                    </div>
                 </div>

                 <div className="relative shadow-2xl rounded-[32px] overflow-hidden mt-8" style={{ height: '520px', aspectRatio: '9/16' }}>
                    <div ref={cardRef} className={clsx("w-full h-full flex flex-col items-center justify-center relative p-8 text-center transition-all duration-700 ease-in-out", (THEME_STYLES[modalTheme] || THEME_STYLES.noir).gradient)}>
                         <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                         <div className="absolute top-12 flex flex-col items-center gap-2 opacity-90">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20"><Shield size={18} className="text-white" /></div>
                            <span className="text-white/80 font-bold uppercase tracking-widest text-xs">Anonymous Q&A</span>
                         </div>
                         <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/30 p-8 rounded-[32px] shadow-2xl w-full rotate-1">
                             <p className={clsx("font-black text-2xl leading-snug break-words drop-shadow-sm", THEME_STYLES[modalTheme].text)}>{selectedQuestion.text}</p>
                         </div>
                         <div className="absolute bottom-12 flex flex-col items-center gap-2">
                             <p className="text-[10px] text-white/60 uppercase tracking-widest font-black">Send messages at</p>
                             <div className="bg-black/20 px-4 py-2 rounded-full border border-white/10"><p className="text-white font-bold text-sm">askme.app<span className="text-white/50">/u/{userProfile?.username}</span></p></div>
                         </div>
                    </div>
                 </div>
                 <div className="mt-6 z-20">
                     <button onClick={handleDownloadImage} disabled={downloading} className="bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-bold px-8 py-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                       {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                       Save Story Asset
                    </button>
                 </div>
              </div>

              <div className="flex-1 bg-white dark:bg-zinc-900 p-8 lg:p-12 flex flex-col justify-center">
                 <div className="max-w-md mx-auto w-full">
                    <div className="flex items-start justify-between mb-4">
                        <div><h3 className="text-3xl font-black mb-3">Reply</h3><p className="text-zinc-500 text-base font-medium">Type your anonymous response.</p></div>
                        <button onClick={handleAISuggest} disabled={aiLoading} className="p-3 bg-pink-500/10 text-pink-600 rounded-2xl transition-all hover:scale-110 active:rotate-12">
                            {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        </button>
                    </div>
                    <div className="relative mb-6">
                        <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Type here..." autoFocus className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-6 text-zinc-900 dark:text-white outline-none resize-none text-xl min-h-[180px] focus:ring-2 focus:ring-pink-500/50 transition-all" />
                        <div className="absolute bottom-6 right-6 text-xs font-bold text-zinc-400">{answerText.length} chars</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 p-5 rounded-[24px] mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4"><div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isPublic ? "bg-pink-500/10 text-pink-500" : "bg-zinc-200 text-zinc-500")}>{isPublic ? <Eye size={20} /> : <Lock size={20} />}</div><div><p className="text-sm font-bold">Public Feed</p></div></div>
                        <button onClick={() => setIsPublic(!isPublic)} className={clsx("relative w-12 h-6 rounded-full transition-colors", isPublic ? "bg-pink-500" : "bg-zinc-300")}><motion.div animate={{ x: isPublic ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"/></button>
                    </div>
                    <button onClick={handlePublish} disabled={!answerText.trim() || publishing} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-[20px] shadow-lg disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all">
                        {publishing ? <Loader2 className="animate-spin" /> : 'Post Answer'}
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
