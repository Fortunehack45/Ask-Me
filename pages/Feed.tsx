import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Inbox, User, Loader2, Sparkles, Check, 
  MessageSquare, Heart, Copy, Shield, Share2, X, Palette, Clock
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
      const dataUrl = await toPng(shareCaptureRef.current, { pixelRatio: 3, width: 1080, height: 1920 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `askme-${userProfile.username}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Ask Me!', text: `Ask @${userProfile.username} anonymously!`, url: shareUrl, files: [file] });
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
    <div className="space-y-10 w-full animate-in fade-in duration-700">
      
      {/* EXPORT NODE (HIDDEN) */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
          <div ref={shareCaptureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", shareTheme.gradient)}>
              <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="w-80 h-80 rounded-full border-[12px] border-white/30 mb-20 overflow-hidden shadow-2xl">
                      <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <div className={clsx("p-24 rounded-[100px] shadow-2xl w-full max-w-4xl border", shareTheme.card)}>
                      <h2 className={clsx("font-black text-8xl tracking-tight text-center", shareTheme.text)}>Send me anonymous messages!</h2>
                  </div>
              </div>
          </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl">
            <Check size={16} className="text-green-500" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Link copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-3">
            Dashboard <span className="text-pink-500" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg mt-2 opacity-80 leading-relaxed">
            Welcome back, <span className="text-pink-600 dark:text-pink-500 font-black">{userProfile?.fullName}</span>.
          </p>
        </div>
        <Link to="/inbox" className="w-full lg:w-auto px-8 py-4 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
          <Inbox size={20} /> My Inbox
        </Link>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
        {/* Left Control Center */}
        <div className="2xl:col-span-4 space-y-8">
            <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-pink-500 via-pink-600 to-orange-500 p-10 text-white shadow-2xl group cursor-pointer"
                onClick={() => setShowStudio(true)}
            >
                <div className="relative z-10">
                  <h2 className="text-3xl font-black tracking-tight mb-4 leading-none">Share Profile</h2>
                  <p className="text-pink-100 font-bold text-lg mb-10 opacity-90 leading-relaxed max-w-xs">Let the world ask you anything, anonymously.</p>
                  <div className="bg-black/20 backdrop-blur-[30px] rounded-3xl p-6 flex items-center gap-4 border border-white/10">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-600 shadow-xl shrink-0"><Share2 size={24} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] uppercase font-black text-white/50 tracking-[0.3em] mb-1">Studio URL</p>
                        <p className="text-lg font-black truncate">askme.app/u/{userProfile?.username}</p>
                      </div>
                  </div>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-100 dark:border-white/5 p-8 rounded-[40px] shadow-sm flex flex-col items-center text-center group transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{loading ? '...' : stats.answers}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mt-3">Published</span>
               </div>
               <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-100 dark:border-white/5 p-8 rounded-[40px] shadow-sm flex flex-col items-center text-center group transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Heart size={24} /></div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{loading ? '...' : stats.likes}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mt-3">Studio Love</span>
               </div>
            </div>
        </div>

        {/* Right Content Stream */}
        <div className="2xl:col-span-8 space-y-8">
            <div className="flex items-center gap-6">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Recent Activity</h3>
                <div className="h-px bg-zinc-100 dark:bg-white/5 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-100 dark:bg-white/5 rounded-[40px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
            <div className="text-center py-32 bg-zinc-50 dark:bg-white/[0.02] rounded-[48px] border-2 border-dashed border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 mb-8 shadow-inner"><Shield size={32} /></div>
                <p className="text-zinc-500 dark:text-zinc-400 font-black text-xl mb-8">Your feed is waiting for its first whisper.</p>
                <Link to="/inbox" className="px-10 py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:scale-110 active:scale-95 transition-all">Check My Inbox</Link>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myAnswers.map((item, i) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * i }}
                    className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-2xl border border-zinc-100 dark:border-white/5 rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:border-pink-500/20 transition-all group relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-6 text-[9px] font-black uppercase text-pink-500 tracking-[0.3em] opacity-80">
                        <MessageSquare size={14} /> <span>Public Response</span>
                    </div>
                    <p className="text-zinc-900 dark:text-white text-2xl font-black leading-tight mb-8 tracking-tighter">{item.questionText}</p>
                    <div className="pt-8 border-t border-zinc-100 dark:border-white/10 relative">
                        <p className="text-zinc-600 dark:text-zinc-300 text-lg font-bold italic opacity-90 leading-relaxed">"{item.answerText}"</p>
                    </div>
                    <div className="mt-8 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                       <span className="flex items-center gap-2 bg-zinc-50 dark:bg-white/5 px-4 py-2 rounded-full border border-zinc-100 dark:border-white/5"><Clock size={14} /> {timeAgo(item.timestamp)}</span>
                       <span className="flex items-center gap-2 bg-pink-500/10 text-pink-500 px-5 py-2.5 rounded-full border border-pink-500/10 group-hover:bg-pink-500 group-hover:text-white transition-all"><Heart size={14} className="fill-current" /> {item.likes}</span>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
      </div>

      {/* STUDIO MODAL */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[40px]" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-white/10">
                <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-lg"><Palette size={20} /></div>
                        <h3 className="text-2xl font-black dark:text-white tracking-tighter">Studio Pro</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-3 text-zinc-400 hover:text-white transition-all bg-zinc-100 dark:bg-white/5 rounded-full"><X size={24} /></button>
                </div>

                <div className="p-10 flex flex-col items-center gap-10 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-2xl rounded-[32px] overflow-hidden" style={{ height: '360px', width: '202px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-8 text-center relative bg-gradient-to-br transition-all duration-700", shareTheme.gradient)}>
                             <div className="w-20 h-20 rounded-full border-[6px] border-white/30 mb-8 overflow-hidden shadow-xl">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-8 rounded-[32px] border shadow-xl w-full text-[14px] font-black leading-tight", shareTheme.card, shareTheme.text)}>Send me anonymous messages!</div>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-center gap-4">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setShareTheme(t)} className={clsx("w-10 h-10 rounded-full border-4 transition-all hover:scale-125", t.css, shareTheme.id === t.id ? "border-pink-500 ring-8 ring-pink-500/10 shadow-xl" : "border-white/10 opacity-70")} />
                        ))}
                    </div>
                </div>

                <div className="p-10 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <button onClick={handleShareLink} disabled={sharing} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-6 rounded-[28px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 text-xl">
                        {sharing ? <Loader2 className="animate-spin" size={28} /> : <Share2 size={28} />} {sharing ? 'Exporting...' : 'Export Asset'}
                    </button>
                    <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-6 opacity-60">High Fidelity Pro Output</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;