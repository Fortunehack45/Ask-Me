
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Inbox, User, Loader2, Sparkles, Check, 
  MessageSquare, Heart, Copy, Shield, Share2, X, Palette
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
    <div className="space-y-10 w-full max-w-full">
      
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
              <div className="absolute bottom-24 w-full flex justify-center">
                  <div className="bg-black/30 backdrop-blur-3xl px-16 py-8 rounded-full border border-white/10 shadow-2xl">
                    <p className="text-white font-black text-4xl tracking-tighter">askme.app<span className="text-white/40">/u/{userProfile?.username}</span></p>
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

      <div className="px-1">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-3">
          Feed <Sparkles className="text-yellow-500" size={32} />
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg mt-1">
          Welcome, <span className="text-zinc-900 dark:text-white font-bold">{userProfile?.fullName || 'User'}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-500 via-pink-600 to-orange-500 p-8 text-white shadow-xl group"
            >
                <div className="relative z-10">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Share Profile</h2>
                  <p className="text-pink-100 font-medium text-sm mb-8">Choose your color and share your card.</p>
                
                  <button 
                      className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 transition-all border border-white/10 w-full cursor-pointer hover:bg-black/30 text-left"
                      onClick={() => setShowStudio(true)}
                  >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pink-600 shadow-lg shrink-0">
                        <Share2 size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-black text-white/50 tracking-wider mb-0.5">tap to customize card</p>
                        <p className="text-base font-black truncate">
                            {userProfile?.username ? `askme.app/u/${userProfile.username}` : 'Loading...'}
                        </p>
                      </div>
                  </button>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none"></div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Answers</span>
                  </div>
                  <span className="text-4xl font-black text-zinc-900 dark:text-white">{loading ? '...' : stats.answers}</span>
               </div>
               <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Heart size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Likes</span>
                  </div>
                  <span className="text-4xl font-black text-zinc-900 dark:text-white">{loading ? '...' : stats.likes}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link to="/inbox" className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex flex-col gap-4 shadow-sm group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Inbox size={20} />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">Inbox</span>
                </Link>
                <Link to={userProfile?.username ? `/u/${userProfile.username}` : '#'} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex flex-col gap-4 shadow-sm group">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User size={20} />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">Profile</span>
                </Link>
            </div>
        </div>

        <div className="lg:col-span-7">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Activity</h3>
                <div className="h-0.5 bg-zinc-100 dark:bg-zinc-800/50 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-900/50 rounded-[28px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/30 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                <p className="text-zinc-500 font-bold">No whispers found.</p>
                <Link to="/inbox" className="text-pink-500 font-black text-sm mt-3 hover:underline">Check Inbox</Link>
            </div>
            ) : (
            <div className="flex flex-col gap-6">
                {myAnswers.map((item, i) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                        <Shield size={12} />
                        <span>Question</span>
                    </div>
                    <p className="text-zinc-900 dark:text-white text-2xl font-black leading-tight mb-8">
                        {item.questionText}
                    </p>
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                        <p className="text-zinc-600 dark:text-zinc-300 text-lg font-medium">
                          {item.answerText}
                        </p>
                    </div>
                    <div className="mt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                       <span>{timeAgo(item.timestamp)}</span>
                       <span className="flex items-center gap-1.5"><Heart size={14} /> {item.likes}</span>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
      </div>

      {/* SHARE STUDIO MODAL */}
      <AnimatePresence>
        {showStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setShowStudio(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-lg"><Palette size={20} /></div>
                        <h3 className="text-xl font-black dark:text-white tracking-tight">Invite Studio</h3>
                    </div>
                    <button onClick={() => setShowStudio(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="p-8 flex flex-col items-center gap-8 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-2xl rounded-[32px] overflow-hidden" style={{ height: '360px', width: '202px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-6 text-center relative bg-gradient-to-br transition-all duration-500", shareTheme.gradient)}>
                             <div className="absolute top-6 flex items-center gap-2 scale-75 opacity-80">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black">A</div>
                             </div>
                             <div className="w-16 h-16 rounded-full border-[4px] border-white/30 mb-4 overflow-hidden shadow-lg">
                                <img src={userProfile?.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-4 rounded-[24px] border shadow-lg w-full text-[12px] font-black leading-tight", shareTheme.card, shareTheme.text)}>
                                Send me anonymous messages!
                             </div>
                             <div className="absolute bottom-6 scale-75 opacity-70">
                                <p className="text-white font-black text-[8px] tracking-tight">askme.app/u/{userProfile?.username}</p>
                             </div>
                        </div>
                    </div>

                    <div className="w-full flex flex-wrap justify-center gap-3">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setShareTheme(t)} className={clsx("w-9 h-9 rounded-full border-4 transition-all hover:scale-110", t.css, shareTheme.id === t.id ? "border-pink-500 ring-4 ring-pink-500/10 shadow-lg" : "border-white/10 opacity-70")} />
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-zinc-900">
                    <button 
                        onClick={handleShareLink} 
                        disabled={sharing}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-5 rounded-[24px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 text-xl"
                    >
                        {sharing ? <Loader2 className="animate-spin" size={24} /> : <Share2 size={24} />}
                        {sharing ? 'Generating...' : 'Share to Stories'}
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
