import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInboxQuestions, publishAnswer, saveFCMToken } from '../services/db';
import { getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { Question } from '../types';
import { Loader2, MessageSquare, Share2, X, Shield, Check, Copy, Download, Bell, Image as ImageIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, copyToClipboard } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

// Vibrant Gradients for the Image Download
const THEME_STYLES: Record<string, { card: string, gradient: string, text: string, subtext: string }> = {
  fiery: {
    card: 'bg-gradient-to-br from-pink-900/30 to-orange-900/30 border-pink-500/30 hover:border-pink-500',
    gradient: 'bg-gradient-to-bl from-rose-600 via-pink-600 to-orange-500',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  ocean: {
    card: 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-cyan-500/30 hover:border-cyan-500',
    gradient: 'bg-gradient-to-bl from-blue-600 via-indigo-600 to-cyan-500',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  jungle: {
    card: 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-emerald-500/30 hover:border-emerald-500',
    gradient: 'bg-gradient-to-bl from-emerald-600 via-green-600 to-teal-500',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  love: {
    card: 'bg-gradient-to-br from-rose-900/30 to-pink-900/30 border-rose-500/30 hover:border-rose-500',
    gradient: 'bg-gradient-to-bl from-rose-500 via-red-500 to-pink-600',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  midnight: {
    card: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 border-indigo-500/30 hover:border-indigo-500',
    gradient: 'bg-gradient-to-bl from-slate-900 via-indigo-900 to-black',
    text: 'text-white',
    subtext: 'text-white/70'
  },
  default: {
    card: 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-pink-500/40',
    gradient: 'bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black',
    text: 'text-zinc-900 dark:text-white',
    subtext: 'text-zinc-500 dark:text-zinc-400'
  }
};

const Inbox = () => {
  const { user, userProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [enablingNotifs, setEnablingNotifs] = useState(false);
  
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

  const enableNotifications = async () => {
    setEnablingNotifs(true);
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const vapidKey = 'REPLACE_WITH_YOUR_VAPID_KEY'; // IMPORTANT: Replace with actual key
        if (vapidKey === 'REPLACE_WITH_YOUR_VAPID_KEY') {
             // Silently fail or log in prod, alert in dev
             console.warn("VAPID Key missing");
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
      await publishAnswer(selectedQuestion, answerText, userProfile);
      setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id));
      setSelectedQuestion(null);
      setAnswerText('');
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
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
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, 
        backgroundColor: 'transparent',
      });
      
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

      {notificationPermission === 'default' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden mb-6 bg-gradient-to-r from-pink-900/10 to-orange-900/10 dark:from-pink-900/40 dark:to-orange-900/40 border border-pink-500/20 rounded-[24px] p-5 flex items-center justify-between"
        >
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
               <Bell size={20} />
             </div>
             <div>
               <p className="text-zinc-900 dark:text-white font-bold text-sm">Don't miss a message</p>
               <p className="text-zinc-500 dark:text-zinc-400 text-xs">Get notified when friends ask.</p>
             </div>
           </div>
           <button 
             onClick={enableNotifications}
             disabled={enablingNotifs}
             className="bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
           >
             {enablingNotifs ? '...' : 'Enable'}
           </button>
        </motion.div>
      )}

      {questions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm"
        >
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-400 dark:text-zinc-600 shadow-inner">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">It's quiet... too quiet.</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto">Share your profile link to start receiving anonymous questions from your friends.</p>
          
          <button 
             onClick={copyLink}
             className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            {copied ? 'Link Copied!' : 'Copy Profile Link'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {questions.map((q, i) => {
             const styles = THEME_STYLES[q.theme || 'default'] || THEME_STYLES['default'];
             // Determine if we need to invert icon colors based on the theme
             // Default theme uses dark text in light mode, so icons should be dark there
             const isDefault = !q.theme || q.theme === 'default';
             
             return (
              <motion.div
                key={q.id}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedQuestion(q)}
                className={clsx(
                  "border p-8 rounded-[32px] cursor-pointer group transition-all relative overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 min-h-[260px] flex flex-col justify-between",
                  styles.card
                )}
              >
                <div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className={clsx("flex items-center gap-2 rounded-full px-3 py-1", isDefault ? "bg-zinc-100 dark:bg-zinc-800" : "bg-black/20")}>
                            <Shield size={12} className={clsx(isDefault ? "text-zinc-500 dark:text-zinc-400" : "text-white/70")} />
                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isDefault ? "text-zinc-500 dark:text-zinc-300" : "text-white/80")}>Anon</span>
                        </div>
                        <span className={clsx("text-xs font-medium", styles.subtext)}>{timeAgo(q.timestamp)}</span>
                    </div>
                    
                    <p className={clsx("text-2xl font-bold leading-snug relative z-10 line-clamp-4", styles.text)}>
                    {q.text}
                    </p>
                </div>
                
                <div className="mt-6 flex justify-end relative z-10">
                   <span className={clsx(
                     "text-xs font-bold transition-transform flex items-center gap-1 px-4 py-2 rounded-full border",
                     "group-hover:scale-105 active:scale-95",
                     isDefault 
                       ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent" 
                       : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                   )}>
                     Reply <Share2 size={12} />
                   </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl"
              onClick={() => setSelectedQuestion(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 50, opacity: 0 }}
              className="w-full max-w-5xl h-[90vh] md:h-[80vh] flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl relative z-10"
            >
              <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="absolute top-4 right-4 z-50 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white/50 dark:bg-black/50 rounded-full p-2 backdrop-blur-md transition-colors"
              >
                  <X size={24} />
              </button>

              {/* LEFT: Image Preview / Generator */}
              <div className="flex-1 bg-zinc-100 dark:bg-black/50 relative flex items-center justify-center p-8 overflow-hidden">
                 <div className="absolute inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                 
                 {/* The Actual Capture Target - 9:16 Ratio */}
                 <div className="relative shadow-2xl shadow-black/20 dark:shadow-black rounded-[32px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10" style={{ height: '560px', aspectRatio: '9/16' }}>
                    <div 
                        ref={cardRef} 
                        className={clsx(
                            "w-full h-full flex flex-col items-center justify-center relative p-8 text-center",
                            (THEME_STYLES[selectedQuestion.theme || 'default'] || THEME_STYLES.default).gradient
                        )}
                    >
                         {/* Background Effects */}
                         <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                         <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] pointer-events-none"></div>
                         <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

                         {/* Header */}
                         <div className="absolute top-12 flex flex-col items-center gap-2 opacity-90">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                                <Shield size={18} className="text-white" fill="white" fillOpacity={0.5} />
                            </div>
                            <span className="text-white/80 font-bold uppercase tracking-widest text-xs">Anonymous Q&A</span>
                         </div>

                         {/* The Question Card */}
                         <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/30 p-8 rounded-[32px] shadow-2xl w-full rotate-1">
                             <p className="text-white font-black text-2xl drop-shadow-sm leading-snug break-words">
                                {selectedQuestion.text}
                             </p>
                         </div>

                         {/* Footer */}
                         <div className="absolute bottom-12 flex flex-col items-center gap-2">
                             <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Send me messages at</p>
                             <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <p className="text-white font-bold text-sm tracking-wide">
                                    askme.app<span className="text-white/50">/u/{userProfile?.username}</span>
                                </p>
                             </div>
                         </div>
                    </div>
                 </div>

                 {/* Download Action overlay on mobile, or bottom on desktop */}
                 <div className="absolute bottom-8 z-20">
                     <button 
                      onClick={handleDownloadImage}
                      disabled={downloading}
                      className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:backdrop-blur-md dark:border-white/20 dark:text-white text-sm font-bold px-6 py-3 rounded-full shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                       {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                       Save for Story
                    </button>
                 </div>
              </div>

              {/* RIGHT: Answer Input */}
              <div className="flex-1 bg-white dark:bg-zinc-900 p-8 lg:p-12 flex flex-col justify-center">
                 <div className="max-w-md mx-auto w-full">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">Reply to this</h3>
                    <p className="text-zinc-500 mb-8 text-base">Your answer will be posted to your public feed.</p>
                    
                    <div className="relative">
                        <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer here..."
                        autoFocus
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-6 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none resize-none text-xl leading-relaxed min-h-[200px] shadow-inner"
                        />
                        <div className="absolute bottom-6 right-6 text-xs font-bold text-zinc-400">
                            {answerText.length} chars
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={handlePublish}
                            disabled={!answerText.trim() || publishing}
                            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-[20px] hover:opacity-90 transition-all flex justify-center items-center gap-2 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {publishing ? <Loader2 className="animate-spin" /> : 'Post Answer'}
                        </button>
                    </div>
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