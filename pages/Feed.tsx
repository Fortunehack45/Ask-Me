
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
    <div className="w-full space-y-8 max-w-none">
      
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

      {/* DASHBOARD TOP ACTION BAR */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-4">
            Studio Center <Sparkles className="text-pink-500" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg opacity-80 leading-relaxed">
            Welcome back, <span className="text-pink-600 dark:text-pink-500 font-black">{userProfile?.fullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Link to="/inbox" className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95">
             <Inbox size={18} /> My Inbox
           </Link>
        </div>
      </header>

      {/* THREE-COLUMN DENSE GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        {/* LEFT COLUMN: Growth & Identity (3/12) */}
        <div className="lg:col-span-3 space-y-6">
            <motion.div 
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ff0080] via-[#ff4d00] to-[#ff8c00] p-8 text-white shadow-[0_30px_60px_-15px_rgba(255,0,128,0.25)] group cursor-pointer"
                onClick={() => setShowStudio(true)}
            >
                <div className="relative z-10 flex flex-col gap-8">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20"><Share2 size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none mb-3">Share Profile</h2>
                    <p className="text-white/80 font-bold text-sm leading-relaxed mb-6">Invite your audience to send anonymous whispers.</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xl rounded-[24px] p-4 flex items-center gap-3 border border-white/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase font-black text-white/50 tracking-[0.3em] mb-1">Link</p>
                        <p className="text-xs font-black truncate tracking-tighter">askme.app/u/{userProfile?.username}</p>
                      </div>
                      <div className="p-2 bg-white/10 rounded-lg"><Copy size={14} /></div>
                  </div>
                </div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 p-6 rounded-[32px] flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4"><MessageSquare size={20} /></div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{loading ? '..' : stats.answers}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-2">Answers</span>
               </div>
               <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 p-6 rounded-[32px] flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4"><Heart size={20} /></div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{loading ? '..' : stats.likes}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-2">Hearts</span>
               </div>
            </div>

            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 p-8 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3 text-zinc-900 dark:text-white font-black text-sm uppercase tracking-widest">
                  <TrendingUp size={16} className="text-emerald-500" /> Insights
                </div>
                <div className="space-y-3">
                   <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 w-[65%]" />
                   </div>
                   <p className="text-[10px] font-bold text-zinc-500">65% profile completion</p>
                </div>
            </div>
        </div>

        {/* MIDDLE COLUMN: Activity Feed (expanded - 6/12) */}
        <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter shrink-0">Recent Activity</h3>
                <div className="h-px bg-zinc-100 dark:bg-white/10 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1,2,3,4].map(i => <div key={i} className="h-56 bg-zinc-100 dark:bg-white/5 rounded-[40px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-white/[0.02] rounded-[48px] border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center">
                    <Shield size={40} className="text-zinc-300 mb-6" />
                    <p className="text-zinc-400 font-black mb-8">No whispers published yet.</p>
                    <button onClick={handleShareLink} className="text-xs font-black text-pink-500 uppercase tracking-widest hover:underline">Share Profile Now</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myAnswers.map((item, i) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-[48px] border border-zinc-200 dark:border-white/5 rounded-[40px] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
                    >
                        <div>
                          <div className="flex items-center gap-3 mb-5 text-[9px] font-black uppercase text-pink-500 tracking-widest">
                              <MessageCircle size={14} /> <span>Public Response</span>
                          </div>
                          <p className="text-zinc-900 dark:text-white text-xl font-black leading-tight mb-6 tracking-tight">{item.questionText}</p>
                          <div className="pt-5 border-t border-zinc-100 dark:border-white/5">
                              <p className="text-zinc-600 dark:text-zinc-400 text-base font-bold italic">"{item.answerText}"</p>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-zinc-400">
                           <span className="flex items-center gap-2"><Clock size={12} /> {timeAgo(item.timestamp)}</span>
                           <span className="flex items-center gap-2 text-pink-500"><Heart size={12} className="fill-current" /> {item.likes}</span>
                        </div>
                    </motion.div>
                    ))}
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: Community & Discover (3/12) */}
        <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter shrink-0">Community</h3>
                <div className="h-px bg-zinc-100 dark:bg-white/10 flex-1"></div>
            </div>

            <div className="bg-zinc-950 dark:bg-white rounded-[40px] p-8 space-y-6 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <Zap className="text-pink-500 mb-6" size={32} />
                   <h4 className="text-xl font-black text-white dark:text-black tracking-tight leading-none mb-4">Go Premium</h4>
                   <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold leading-relaxed mb-8">Unlock detailed analytics and custom studio themes.</p>
                   <button className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Unlock Studio Pro</button>
                </div>
            </div>

            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 p-8 rounded-[40px] space-y-6">
                <div className="flex items-center gap-3 text-zinc-900 dark:text-white font-black text-sm uppercase tracking-widest">
                  <Users size={16} className="text-blue-500" /> Active Creators
                </div>
                <div className="space-y-4">
                   {[1,2,3].map(i => (
                     <div key={i} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-white/10" />
                        <div className="flex-1 min-w-0">
                           <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-1" />
                           <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     </div>
                   ))}
                </div>
            </div>
        </div>
      </div>

      {/* STUDIO ASSET MODAL */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-[40px]" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[60px] shadow-2xl overflow-hidden flex flex-col border border-white/10">
                <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[16px] bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20"><Palette size={20} /></div>
                        <h3 className="text-2xl font-black dark:text-white tracking-tighter">Export Identity</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-3 text-zinc-400 hover:text-white bg-zinc-100 dark:bg-white/5 rounded-full"><X size={24} /></button>
                </div>

                <div className="p-10 flex flex-col items-center gap-10 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-2xl rounded-[40px] overflow-hidden" style={{ height: '380px', width: '214px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-8 text-center relative bg-gradient-to-br transition-all duration-700", shareTheme.gradient)}>
                             <div className="w-20 h-20 rounded-full border-[6px] border-white/30 mb-8 overflow-hidden shadow-xl">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-8 rounded-[36px] border shadow-xl w-full text-sm font-black leading-tight", shareTheme.card, shareTheme.text)}>Send me anonymous messages!</div>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-center gap-4">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setShareTheme(t)} className={clsx("w-10 h-10 rounded-full border-2 transition-all hover:scale-110", t.css, shareTheme.id === t.id ? "border-pink-500 ring-8 ring-pink-500/10 shadow-lg" : "border-white/10 opacity-70")} />
                        ))}
                    </div>
                </div>

                <div className="p-10 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <button onClick={handleShareLink} disabled={sharing} className="w-full bg-pink-500 text-white font-black py-6 rounded-[28px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 text-xl">
                        {sharing ? <Loader2 className="animate-spin" size={24} /> : <Share2 size={24} />} {sharing ? 'Rendering...' : 'Share Profile'}
                    </button>
                    <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-6 opacity-60">Studio Native Asset</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;
