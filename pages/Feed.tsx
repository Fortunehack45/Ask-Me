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
    <div className="space-y-16 w-full animate-in fade-in duration-1000">
      
      {/* HIDDEN ASSET GENERATOR */}
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
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl"
          >
            <Check size={20} className="text-green-500" />
            <span className="font-black text-sm uppercase tracking-widest">Link copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl md:text-8xl xl:text-9xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-4">
            Dashboard <Sparkles className="text-pink-500" size={56} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-2xl mt-4 max-w-3xl leading-relaxed">
            Welcome back to the studio, <span className="text-pink-600 dark:text-pink-500 font-black">{userProfile?.fullName}</span>.
          </p>
        </div>
        <div className="flex gap-4">
           <Link to="/inbox" className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[28px] font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all">
              <Inbox size={24} /> My Inbox
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-12">
        {/* ACTION COLUMN */}
        <div className="2xl:col-span-5 space-y-12">
            <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                className="relative overflow-hidden rounded-[64px] bg-gradient-to-br from-pink-500 via-pink-600 to-orange-500 p-16 text-white shadow-[0_40px_100px_rgba(236,72,153,0.3)] group cursor-pointer"
                onClick={() => setShowStudio(true)}
            >
                <div className="relative z-10">
                  <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-none">Share Profile</h2>
                  <p className="text-pink-100 font-bold text-2xl mb-16 opacity-90 leading-relaxed max-w-md">Let the world ask you anything, anonymously.</p>
                
                  <div className="bg-black/20 backdrop-blur-[40px] rounded-[44px] p-10 flex items-center gap-8 border border-white/10 transition-all hover:bg-black/30">
                      <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-pink-600 shadow-2xl shrink-0">
                        <Share2 size={40} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-black text-white/60 tracking-[0.4em] mb-2">Studio URL</p>
                        <p className="text-2xl font-black truncate">askme.app/u/{userProfile?.username}</p>
                      </div>
                  </div>
                </div>
                <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-white/10 rounded-full blur-[140px] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-10">
               <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 p-14 rounded-[64px] shadow-sm flex flex-col items-center text-center group hover:border-pink-500/30 transition-all">
                  <div className="w-20 h-20 rounded-[28px] bg-pink-500/10 text-pink-500 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                    <MessageSquare size={36} />
                  </div>
                  <span className="text-8xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter leading-none">{loading ? '...' : stats.answers}</span>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mt-2">Published</span>
               </div>
               <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 p-14 rounded-[64px] shadow-sm flex flex-col items-center text-center group hover:border-orange-500/30 transition-all">
                  <div className="w-20 h-20 rounded-[28px] bg-orange-500/10 text-orange-500 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                    <Heart size={36} />
                  </div>
                  <span className="text-8xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter leading-none">{loading ? '...' : stats.likes}</span>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mt-2">Total Love</span>
               </div>
            </div>
        </div>

        {/* CONTENT COLUMN */}
        <div className="2xl:col-span-7 space-y-12">
            <div className="flex items-center gap-8">
                <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Studio Activity</h3>
                <div className="h-px bg-zinc-200 dark:bg-white/10 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 gap-10">
                   {[1,2,3].map(i => <div key={i} className="h-80 bg-zinc-100 dark:bg-white/5 rounded-[64px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
            <div className="text-center py-60 bg-zinc-50 dark:bg-white/[0.02] rounded-[72px] border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 mb-12 shadow-inner">
                   <Shield size={56} />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-black text-3xl mb-10">Your feed is waiting for its first whisper.</p>
                <Link to="/inbox" className="px-16 py-7 bg-pink-500 text-white rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all">Check My Inbox</Link>
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-10">
                {myAnswers.map((item, i) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * i, type: "spring", stiffness: 100 }}
                    className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[64px] p-16 shadow-sm hover:shadow-2xl hover:border-pink-500/20 transition-all group relative overflow-hidden"
                >
                    <div className="flex items-center gap-4 mb-12 text-xs font-black uppercase text-pink-500 tracking-[0.4em]">
                        <MessageSquare size={20} />
                        <span>Studio Post</span>
                    </div>
                    <p className="text-zinc-900 dark:text-white text-5xl md:text-6xl font-black leading-[1.1] mb-14 tracking-tighter">
                        {item.questionText}
                    </p>
                    <div className="pt-14 border-t border-zinc-100 dark:border-white/10 relative">
                        <div className="absolute -top-4 left-12 px-6 bg-white dark:bg-[#0c0c0e] text-zinc-400 font-black text-[11px] uppercase tracking-[0.4em] rounded-full border border-zinc-100 dark:border-white/5 py-1">Response</div>
                        <p className="text-zinc-600 dark:text-zinc-300 text-3xl md:text-4xl font-bold leading-relaxed italic opacity-90">
                          "{item.answerText}"
                        </p>
                    </div>
                    <div className="mt-16 flex justify-between items-center text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">
                       <span className="flex items-center gap-3.5 bg-zinc-50 dark:bg-white/5 px-8 py-4 rounded-full border border-zinc-100 dark:border-white/5">
                          <Clock size={20} /> {timeAgo(item.timestamp)}
                       </span>
                       <span className="flex items-center gap-3.5 bg-pink-500/10 text-pink-500 px-8 py-4 rounded-full border border-pink-500/10 transition-all group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-pink-500/30">
                          <Heart size={20} className="fill-current" /> {item.likes}
                       </span>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
      </div>

      {/* STUDIO RENDER MODAL */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[60px]" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[72px] shadow-2xl overflow-hidden flex flex-col border border-white/10">
                <div className="p-14 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[28px] bg-pink-500 text-white flex items-center justify-center shadow-2xl shadow-pink-500/30"><Palette size={32} /></div>
                        <h3 className="text-4xl font-black dark:text-white tracking-tighter leading-none">Studio Pro</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-5 text-zinc-400 hover:text-white transition-all bg-zinc-100 dark:bg-white/5 rounded-full"><X size={32} /></button>
                </div>

                <div className="p-16 flex flex-col items-center gap-16 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-[0_80px_160px_-20px_rgba(0,0,0,0.6)] rounded-[64px] overflow-hidden transition-all duration-700" style={{ height: '520px', width: '292px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-14 text-center relative bg-gradient-to-br transition-all duration-700", shareTheme.gradient)}>
                             <div className="w-28 h-28 rounded-full border-[10px] border-white/30 mb-12 overflow-hidden shadow-2xl">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-12 rounded-[48px] border shadow-2xl w-full text-[20px] font-black leading-tight", shareTheme.card, shareTheme.text)}>
                                Send me anonymous messages!
                             </div>
                        </div>
                    </div>

                    <div className="w-full flex flex-wrap justify-center gap-8">
                        {THEMES.map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setShareTheme(t)} 
                                className={clsx(
                                    "w-16 h-16 rounded-full border-4 transition-all hover:scale-125",
                                    t.css,
                                    shareTheme.id === t.id ? "border-pink-500 ring-[14px] ring-pink-500/10 shadow-2xl" : "border-white/10 opacity-70"
                                )} 
                            />
                        ))}
                    </div>
                </div>

                <div className="p-16 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <button 
                        onClick={handleShareLink} 
                        disabled={sharing}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-9 rounded-[40px] shadow-2xl flex items-center justify-center gap-6 transition-all active:scale-95 disabled:opacity-50 text-3xl"
                    >
                        {sharing ? <Loader2 className="animate-spin" size={40} /> : <Share2 size={40} />}
                        {sharing ? 'Processing...' : 'Export Asset'}
                    </button>
                    <p className="text-center text-[13px] font-black uppercase tracking-[0.6em] text-zinc-400 mt-10 opacity-60">High Fidelity Studio Output</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;