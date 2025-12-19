import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Inbox, User, Loader2, Sparkles, Check, 
  MessageSquare, Heart, Copy, Shield, Share2, X, Palette,
  // Added Clock icon to fix reference error on line 248
  Clock
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFeed, getUserStats } from '../services/db';
import { Answer } from '../types';
import { timeAgo, copyToClipboard } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

const THEMES = [
  { id: 'ocean', name: 'Ocean', css: 'bg-blue-600', gradient: 'from-blue-600 via-blue-700 to-indigo-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'noir', name: 'Noir', css: 'bg-zinc-950', gradient: 'from-zinc-900 via-zinc-950 to-black', text: 'text-white', card: 'bg-white/5 backdrop-blur-2xl border-white/10' },
  { id: 'crimson', name: 'Crimson', css: 'bg-rose-600', gradient: 'from-rose-500 via-pink-600 to-rose-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'aurora', name: 'Aurora', css: 'bg-emerald-600', gradient: 'from-emerald-400 via-teal-500 to-emerald-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'sunset', name: 'Sunset', css: 'bg-orange-500', gradient: 'from-orange-400 via-pink-500 to-rose-600', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'nebula', name: 'Nebula', css: 'bg-purple-600', gradient: 'from-violet-400 via-purple-600 to-indigo-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'midnight', name: 'Midnight', css: 'bg-slate-900', gradient: 'from-slate-800 via-slate-950 to-black', text: 'text-white', card: 'bg-white/5 border-white/10' },
  { id: 'lemonade', name: 'Lemonade', css: 'bg-yellow-400', gradient: 'from-yellow-300 via-orange-400 to-amber-600', text: 'text-zinc-900', card: 'bg-black/5 backdrop-blur-2xl border-black/10' },
];

const Feed: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [myAnswers, setMyAnswers] = useState<Answer[]>([]);
  const [stats, setStats] = useState({ answers: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [shareTheme, setShareTheme] = useState(THEMES[0]);
  const [showToast, setShowToast] = useState(false);
  const shareCaptureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMyContent = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const [feedData, statsData] = await Promise.all([
            getUserFeed(user.uid),
            getUserStats(user.uid)
          ]);
          setMyAnswers(feedData);
          setStats(statsData);
        } catch (e) {
          console.error("Dashboard error", e);
        } finally {
          setLoading(false);
        }
      }
    };
    loadMyContent();
  }, [user]);

  const shareUrl = userProfile?.username 
    ? `${window.location.origin}/#/u/${userProfile.username}`
    : '';

  const handleShareLink = async () => {
    if (!userProfile || !shareCaptureRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(shareCaptureRef.current, { 
        pixelRatio: 3, 
        width: 1080, 
        height: 1920 
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `askme-${userProfile.username}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Ask Me Anything!',
          text: `Ask @${userProfile.username} anything anonymously!`,
          url: shareUrl,
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({ title: 'Ask Me', text: `Ask @${userProfile.username}`, url: shareUrl });
      } else {
        await copyToClipboard(shareUrl);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      setShowStudio(false);
    } catch (err) {
      console.log("Share failed", err);
    } finally {
      setSharing(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-500">
      
      {/* HIDDEN SHARE ASSET GENERATOR */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
          <div ref={shareCaptureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", shareTheme.gradient)}>
              <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
              <div className="absolute top-24 flex items-center gap-6">
                <div className="w-20 h-20 rounded-[28px] bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                  <span className="text-white font-black text-4xl">A</span>
                </div>
                <span className="text-white font-black uppercase tracking-[0.5em] text-2xl">ASK ME</span>
              </div>
              <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="w-80 h-80 rounded-full border-[12px] border-white/30 mb-20 overflow-hidden shadow-2xl">
                      <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <div className={clsx("p-24 rounded-[100px] shadow-2xl w-full max-w-4xl border", shareTheme.card)}>
                      <h2 className={clsx("font-black text-8xl leading-tight tracking-tight text-center", shareTheme.text)}>Send me anonymous messages!</h2>
                  </div>
              </div>
          </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <Check size={16} className="text-green-500" />
            <span className="font-bold text-sm">Link copied!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-3">
            Feed <Sparkles className="text-yellow-500" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xl mt-2">
            Welcome, <span className="text-pink-500 font-black">{userProfile?.fullName || 'User'}</span>.
          </p>
        </div>
        <div className="flex gap-2">
           <Link to="/inbox" className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-colors">
              <Inbox size={18} /> Inbox
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Quick Actions & Stats */}
        <div className="xl:col-span-4 space-y-8">
            <motion.div 
                whileHover={{ y: -5 }}
                className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-pink-500 via-pink-600 to-orange-500 p-10 text-white shadow-2xl group cursor-pointer"
                onClick={() => setShowStudio(true)}
            >
                <div className="relative z-10">
                  <h2 className="text-3xl font-black tracking-tight mb-3">Share Profile</h2>
                  <p className="text-pink-100 font-medium text-lg mb-10 opacity-90">Customize your mysterious identity and invite whispers.</p>
                
                  <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-6 flex items-center gap-5 border border-white/10 transition-all hover:bg-black/30">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-pink-600 shadow-xl shrink-0">
                        <Share2 size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase font-black text-white/60 tracking-widest mb-1">Live URL</p>
                        <p className="text-lg font-black truncate">askme.app/u/{userProfile?.username}</p>
                      </div>
                  </div>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-white/10 rounded-full blur-[80px] pointer-events-none"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[36px] shadow-sm flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white mb-1">{loading ? '...' : stats.answers}</span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Total Answers</span>
               </div>
               <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[36px] shadow-sm flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <Heart size={24} />
                  </div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white mb-1">{loading ? '...' : stats.likes}</span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Total Likes</span>
               </div>
            </div>

            <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-10 rounded-[40px] shadow-xl">
               <h3 className="text-2xl font-black mb-4 tracking-tight">Pro Tip</h3>
               <p className="text-zinc-400 dark:text-zinc-500 font-medium text-lg leading-relaxed">
                 Post your profile link to your Instagram Bio to increase question frequency by up to 300%.
               </p>
               <button onClick={handleShareLink} className="mt-8 w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-pink-500/20">
                 Copy Link Now
               </button>
            </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="xl:col-span-8">
            <div className="flex items-center gap-6 mb-8">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Recent Activity</h3>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800/50 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900/50 rounded-[40px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
            <div className="text-center py-32 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-[48px] border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-6">
                   <Shield size={32} />
                </div>
                <p className="text-zinc-500 font-black text-xl mb-4">No whispers found in the feed.</p>
                <Link to="/inbox" className="px-8 py-3 bg-pink-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-105 transition-all">Check Inbox</Link>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {myAnswers.map((item, i) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-10 shadow-sm hover:shadow-xl transition-all group"
                >
                    <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase text-pink-500 tracking-[0.2em]">
                        <MessageSquare size={14} />
                        <span>Anonymous</span>
                    </div>
                    <p className="text-zinc-900 dark:text-white text-3xl font-black leading-tight mb-8 tracking-tight">
                        {item.questionText}
                    </p>
                    <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/80">
                        <p className="text-zinc-600 dark:text-zinc-300 text-xl font-medium leading-relaxed italic">
                          "{item.answerText}"
                        </p>
                    </div>
                    <div className="mt-10 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                       <span className="flex items-center gap-2">
                          <Clock size={14} /> {timeAgo(item.timestamp)}
                       </span>
                       <span className="flex items-center gap-2 bg-pink-500/10 text-pink-500 px-4 py-1.5 rounded-full">
                          <Heart size={14} className="fill-pink-500" /> {item.likes}
                       </span>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
      </div>

      {/* SHARE STUDIO MODAL (Identical but styled for consistency) */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-lg"><Palette size={24} /></div>
                        <h3 className="text-2xl font-black dark:text-white tracking-tighter">Studio Pro</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><X size={28} /></button>
                </div>

                <div className="p-10 flex flex-col items-center gap-10 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-2xl rounded-[40px] overflow-hidden" style={{ height: '400px', width: '225px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-8 text-center relative bg-gradient-to-br transition-all duration-500", shareTheme.gradient)}>
                             <div className="w-16 h-16 rounded-full border-[5px] border-white/30 mb-6 overflow-hidden shadow-xl">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-6 rounded-[32px] border shadow-2xl w-full text-[14px] font-black leading-tight", shareTheme.card, shareTheme.text)}>
                                Send me anonymous messages!
                             </div>
                        </div>
                    </div>

                    <div className="w-full flex flex-wrap justify-center gap-4">
                        {THEMES.map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setShareTheme(t)} 
                                className={clsx(
                                    "w-10 h-10 rounded-full border-4 transition-all hover:scale-125",
                                    t.css,
                                    shareTheme.id === t.id ? "border-pink-500 ring-4 ring-pink-500/10 shadow-lg" : "border-white/10 opacity-70"
                                )} 
                            />
                        ))}
                    </div>
                </div>

                <div className="p-10 bg-white dark:bg-zinc-900">
                    <button 
                        onClick={handleShareLink} 
                        disabled={sharing}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-6 rounded-[28px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 text-xl"
                    >
                        {sharing ? <Loader2 className="animate-spin" size={28} /> : <Share2 size={28} />}
                        {sharing ? 'Generating...' : 'Share Profile'}
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;
