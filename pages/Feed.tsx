import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Inbox, Loader2, Sparkles, Check, 
  MessageSquare, Heart, Shield, Share2, Palette, Clock, X, Zap, TrendingUp, Users,
  Copy, MessageCircle
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
    <div className="w-full space-y-10 animate-in fade-in duration-1000">
      
      {/* EXPORT NODE (HIDDEN) */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
          <div ref={shareCaptureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", shareTheme.gradient)}>
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

      {/* DASHBOARD TOP ACTION BAR - HIGH DENSITY */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-4">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-4">
            Dashboard <Sparkles className="text-pink-500" size={36} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl opacity-80 leading-relaxed">
            Welcome back, <span className="text-pink-600 dark:text-pink-500 font-black">{userProfile?.fullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Link to="/inbox" className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all">
             <Inbox size={22} /> My Inbox
           </Link>
        </div>
      </header>

      {/* FULL SCREEN DENSE GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        
        {/* LEFT COLUMN: Growth & Identity (4/12) */}
        <div className="lg:col-span-4 space-y-8">
            <motion.div 
                whileHover={{ y: -6, scale: 1.01 }}
                className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-[#ff0080] via-[#ff4d00] to-[#ff8c00] p-10 text-white shadow-[0_40px_80px_-20px_rgba(255,0,128,0.4)] group cursor-pointer"
                onClick={() => setShowStudio(true)}
            >
                <div className="relative z-10 flex flex-col gap-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[22px] flex items-center justify-center border border-white/20 shadow-lg"><Share2 size={32} /></div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight leading-none">Share Profile</h2>
                    <p className="text-white/80 font-bold text-lg leading-relaxed max-w-sm">Invite your audience to send anonymous whispers.</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-2xl rounded-[32px] p-6 flex items-center justify-between border border-white/10 group-hover:bg-black/30 transition-colors">
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-[10px] uppercase font-black text-white/50 tracking-[0.4em] mb-2">Unique Link</p>
                        <p className="text-lg font-black truncate tracking-tight">askme.app/u/{userProfile?.username}</p>
                      </div>
                      <div className="p-4 bg-white/15 rounded-2xl group-hover:bg-white/25 transition-all"><Copy size={20} /></div>
                  </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-[50px] border border-zinc-200 dark:border-white/5 p-10 rounded-[48px] flex flex-col items-center text-center shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6 border border-pink-500/5 shadow-inner"><MessageSquare size={28} /></div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{loading ? '..' : stats.answers}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-4">Published</span>
               </div>
               <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-[50px] border border-zinc-200 dark:border-white/5 p-10 rounded-[48px] flex flex-col items-center text-center shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6 border border-orange-500/5 shadow-inner"><Heart size={28} /></div>
                  <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{loading ? '..' : stats.likes}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-4">Hearts</span>
               </div>
            </div>

            <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-[50px] border border-zinc-200 dark:border-white/5 p-10 rounded-[48px] space-y-6 shadow-sm">
                <div className="flex items-center gap-4 text-zinc-900 dark:text-white font-black text-sm uppercase tracking-[0.4em]">
                  <TrendingUp size={20} className="text-emerald-500" /> Portal Insights
                </div>
                <div className="space-y-4">
                   <div className="h-2 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5 }} className="h-full bg-pink-500 rounded-full" />
                   </div>
                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500">
                     <span>Profile Strength</span>
                     <span className="text-zinc-900 dark:text-white">65%</span>
                   </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Activity Feed (expanded - 8/12) */}
        <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-6 mb-2">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter shrink-0">Recent Activity Feed</h3>
                <div className="h-px bg-zinc-200/50 dark:bg-white/10 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[1,2,3,4].map(i => <div key={i} className="h-64 bg-zinc-100 dark:bg-white/5 rounded-[56px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
                <div className="text-center py-32 bg-zinc-50 dark:bg-white/[0.02] rounded-[64px] border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center">
                    <Shield size={64} className="text-zinc-300 mb-8 opacity-40" />
                    <p className="text-zinc-500 font-black text-xl mb-10">No public whispers published to your feed.</p>
                    <button onClick={() => setShowStudio(true)} className="px-12 py-5 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-xl transition-all hover:scale-105 active:scale-95">Share Profile Now</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {myAnswers.map((item, i) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-[64px] border border-zinc-200 dark:border-white/5 rounded-[56px] p-10 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all group flex flex-col justify-between"
                    >
                        <div>
                          <div className="flex items-center gap-3 mb-8 text-[10px] font-black uppercase text-pink-500 tracking-[0.4em]">
                              <MessageCircle size={18} /> <span>Public Feedback</span>
                          </div>
                          <p className="text-zinc-900 dark:text-white text-2xl font-black leading-tight mb-8 tracking-tight">{item.questionText}</p>
                          <div className="pt-8 border-t border-zinc-100 dark:border-white/5">
                              <p className="text-zinc-600 dark:text-zinc-400 text-lg font-bold italic opacity-90 leading-relaxed">"{item.answerText}"</p>
                          </div>
                        </div>
                        <div className="mt-10 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                           <span className="flex items-center gap-3"><Clock size={16} /> {timeAgo(item.timestamp)}</span>
                           <span className="flex items-center gap-3 text-pink-500 bg-pink-500/10 px-4 py-2 rounded-full border border-pink-500/10 shadow-sm"><Heart size={16} className="fill-current" /> {item.likes}</span>
                        </div>
                    </motion.div>
                    ))}
                </div>
            )}
            
            {/* FOOTER CALL TO ACTION */}
            <div className="bg-zinc-950 dark:bg-white rounded-[56px] p-12 md:p-16 text-white dark:text-black flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center md:text-left space-y-4">
                   <h4 className="text-4xl font-black tracking-tighter leading-none">Upgrade to Studio Pro</h4>
                   <p className="text-zinc-500 font-bold text-lg leading-relaxed max-w-md">Unlock full acquisition metrics, custom branding tools, and high-fidelity themes.</p>
                </div>
                <button className="relative z-10 shrink-0 px-14 py-6 bg-pink-500 text-white rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(236,72,153,0.5)] active:scale-95 transition-all hover:scale-105">Activate Now <Zap size={20} className="inline ml-3" /></button>
            </div>
        </div>
      </div>

      {/* STUDIO ASSET MODAL - FULL OVERLAY */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[64px]" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 60 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 60 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[72px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/10">
                <div className="p-10 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[22px] bg-pink-500 text-white flex items-center justify-center shadow-2xl shadow-pink-500/30"><Palette size={28} /></div>
                        <h3 className="text-3xl font-black dark:text-white tracking-tighter">Export Asset</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-4 text-zinc-400 hover:text-white bg-zinc-100 dark:bg-white/5 rounded-full transition-all active:scale-90"><X size={32} /></button>
                </div>

                <div className="p-12 flex flex-col items-center gap-12 bg-zinc-50 dark:bg-zinc-950/40">
                    <div className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[48px] overflow-hidden" style={{ height: '480px', width: '270px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-10 text-center relative bg-gradient-to-br transition-all duration-1000", shareTheme.gradient)}>
                             <div className="w-24 h-24 rounded-full border-[8px] border-white/30 mb-10 overflow-hidden shadow-2xl ring-4 ring-black/5">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-10 rounded-[44px] border shadow-2xl w-full text-lg font-black leading-tight", shareTheme.card, shareTheme.text)}>Send me anonymous messages!</div>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-center gap-5">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setShareTheme(t)} className={clsx("w-12 h-12 rounded-full border-4 transition-all hover:scale-110", t.css, shareTheme.id === t.id ? "border-pink-500 ring-[12px] ring-pink-500/10 shadow-2xl" : "border-white/10 opacity-70")} />
                        ))}
                    </div>
                </div>

                <div className="p-14 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <button onClick={handleShareLink} disabled={sharing} className="w-full bg-pink-500 text-white font-black py-8 rounded-[40px] shadow-[0_30px_60px_-10px_rgba(236,72,153,0.5)] flex items-center justify-center gap-6 transition-all active:scale-95 disabled:opacity-50 text-2xl">
                        {sharing ? <Loader2 className="animate-spin" size={32} /> : <Share2 size={32} />} {sharing ? 'Rendering...' : 'Share Profile'}
                    </button>
                    <p className="text-center text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 mt-8 opacity-50">Studio Native Identity System</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;