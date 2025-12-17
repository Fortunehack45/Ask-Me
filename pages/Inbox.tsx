import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInboxQuestions, publishAnswer, saveFCMToken } from '../services/db';
import { getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { Question } from '../types';
import { Loader2, MessageSquare, Share2, X, Shield, Check, Copy, Download, Bell } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, copyToClipboard } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

// Theme Mapper
const getThemeStyles = (theme?: string) => {
  switch (theme) {
    case 'fiery':
      return {
        card: 'bg-gradient-to-br from-pink-900/30 to-orange-900/30 border-pink-500/30 hover:border-pink-500',
        download: 'bg-gradient-to-bl from-pink-500 via-rose-500 to-orange-500'
      };
    case 'ocean':
      return {
        card: 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-cyan-500/30 hover:border-cyan-500',
        download: 'bg-gradient-to-bl from-blue-600 via-sky-500 to-cyan-400'
      };
    case 'jungle':
      return {
        card: 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-emerald-500/30 hover:border-emerald-500',
        download: 'bg-gradient-to-bl from-green-600 via-emerald-500 to-teal-400'
      };
    case 'love':
      return {
        card: 'bg-gradient-to-br from-rose-900/30 to-pink-900/30 border-rose-500/30 hover:border-rose-500',
        download: 'bg-gradient-to-bl from-rose-600 via-pink-500 to-red-400'
      };
    case 'midnight':
      return {
        card: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 border-indigo-500/30 hover:border-indigo-500',
        download: 'bg-gradient-to-bl from-indigo-900 via-purple-800 to-slate-900'
      };
    case 'default':
    default:
      return {
        card: 'bg-zinc-900/60 border-zinc-800/80 hover:border-pink-500/40',
        download: 'bg-gradient-to-bl from-zinc-800 via-zinc-700 to-zinc-600'
      };
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
             alert("VAPID Key missing in code.");
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
    } else {
      alert(`Could not copy link automatically. Please copy it manually:\n${url}`);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Use toPng to generate a data URL
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, // High resolution for social media
        backgroundColor: 'transparent'
      });
      
      const link = document.createElement('a');
      link.download = `askme-question-${Date.now()}.png`;
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
    <div>
      <header className="mb-8 flex items-end justify-between">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight">Inbox</h1>
           <p className="text-zinc-400 text-sm font-medium mt-1">
             <span className="text-pink-500 font-bold">{questions.length}</span> questions waiting
           </p>
        </div>
      </header>

      {/* Mobile Notification Banner */}
      {notificationPermission === 'default' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden mb-6 bg-gradient-to-r from-pink-900/40 to-orange-900/40 border border-pink-500/20 rounded-2xl p-4 flex items-center justify-between"
        >
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400">
               <Bell size={20} />
             </div>
             <div>
               <p className="text-white font-bold text-sm">Don't miss a message</p>
               <p className="text-zinc-400 text-xs">Get notified when friends ask.</p>
             </div>
           </div>
           <button 
             onClick={enableNotifications}
             disabled={enablingNotifs}
             className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-zinc-200"
           >
             {enablingNotifs ? '...' : 'Enable'}
           </button>
        </motion.div>
      )}

      {questions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-[32px] p-12 text-center flex flex-col items-center max-w-2xl mx-auto"
        >
          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-600 shadow-inner">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">It's quiet... too quiet.</h3>
          <p className="text-zinc-500 mb-8 max-w-xs mx-auto">Share your profile link to start receiving anonymous questions from your friends.</p>
          
          <button 
             onClick={copyLink}
             className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            {copied ? 'Link Copied!' : 'Copy Profile Link'}
          </button>
        </motion.div>
      ) : (
        /* Grid updated to be 3 columns on XL and 4 on 2XL */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {questions.map((q, i) => {
             const styles = getThemeStyles(q.theme);
             return (
              <motion.div
                key={q.id}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedQuestion(q)}
                className={clsx(
                  "border p-6 rounded-[24px] cursor-pointer group transition-all relative overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-md min-h-[220px] flex flex-col justify-between",
                  styles.card
                )}
              >
                <div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full px-2.5 py-1">
                        <Shield size={10} className="text-white/70" />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Anon</span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400">{timeAgo(q.timestamp)}</span>
                    </div>
                    
                    <p className="text-lg font-bold text-white leading-relaxed group-hover:text-pink-100 transition-colors relative z-10 line-clamp-4">
                    "{q.text}"
                    </p>
                </div>
                
                <div className="mt-4 flex justify-end relative z-10">
                   <span className="text-xs font-bold text-white/80 group-hover:translate-x-1 transition-transform flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
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
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedQuestion(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 100, opacity: 0 }}
              className="w-full max-w-sm relative z-10"
            >
              <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="absolute -top-14 right-0 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-full p-2 border border-zinc-700"
              >
                  <X size={24} />
              </button>

              {/* Story Style Card - The Downloadable Area */}
              <div className="bg-zinc-950 rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl">
                
                {/* Ref applied here for capture. Uses theme gradient. */}
                <div 
                  ref={cardRef} 
                  className={clsx(
                    "p-8 min-h-[300px] flex flex-col items-center justify-center relative select-none",
                    getThemeStyles(selectedQuestion.theme).download
                  )}
                >
                   {/* Background Noise for Texture in Image */}
                   <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                   
                   <div className="glass bg-white/20 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl w-full text-center transform rotate-1 mb-6 relative z-10">
                      <div className="flex justify-center mb-2 opacity-70">
                        <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                          <Shield size={14} className="text-white" />
                        </div>
                      </div>
                      <p className="text-white font-black text-xl drop-shadow-md leading-tight break-words">
                        {selectedQuestion.text}
                      </p>
                   </div>
                   
                   {/* Branding Footer for the Image */}
                   <div className="absolute bottom-4 flex flex-col items-center gap-1 opacity-90">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Sent via</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-black flex items-center justify-center text-white font-black text-[10px]">A</span>
                        <span className="text-white font-bold text-sm tracking-tight">Ask Me</span>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-zinc-900">
                  {/* Action Buttons Row */}
                  <div className="flex gap-3 mb-6">
                    <button 
                      onClick={handleDownloadImage}
                      disabled={downloading}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-700"
                    >
                       {downloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                       Save Image
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your answer..."
                      autoFocus
                      className="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none text-lg mb-6"
                      rows={3}
                    />
                  </div>
                  
                  <button
                    onClick={handlePublish}
                    disabled={!answerText.trim() || publishing}
                    className="w-full bg-white text-black font-black text-lg py-3.5 rounded-xl hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2 active:scale-95"
                  >
                    {publishing ? <Loader2 className="animate-spin" /> : 'Share Answer'}
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