import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Share2, Inbox, User, Loader2, ExternalLink, Shield, Flame, Sparkles, Check, MessageSquare, Heart, Copy } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFeed, getUserStats } from '../services/db';
import { Answer } from '../types';
import { timeAgo, copyToClipboard } from '../utils';

const Feed = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [myAnswers, setMyAnswers] = useState<Answer[]>([]);
  const [stats, setStats] = useState({ answers: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const loadMyContent = async () => {
      if (user?.uid) {
        setLoading(true);
        
        // 1. Load Feed
        try {
          const feedData = await getUserFeed(user.uid);
          setMyAnswers(feedData);
        } catch (e) {
          console.error("Failed to load feed", e);
        }

        // 2. Load Stats (Independently)
        try {
          const statsData = await getUserStats(user.uid);
          setStats(statsData);
        } catch (e) {
          console.error("Failed to load stats", e);
        }

        setLoading(false);
      }
    };
    loadMyContent();
  }, [user]);

  // Construct absolute URL safely
  const shareUrl = userProfile?.username 
    ? `${window.location.origin}/#/u/${userProfile.username}`
    : '';

  const handleShareLink = async () => {
    if (!shareUrl) return;

    // 1. Try Native Share (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ask Me',
          text: `Ask @${userProfile?.username} anything anonymously!`,
          url: shareUrl,
        });
        return; 
      } catch (err) { 
        console.log("Share cancelled or failed, falling back to copy", err);
      }
    }

    // 2. Fallback to clipboard
    const success = await copyToClipboard(shareUrl);
    if (success) {
      triggerToast();
    } else {
      alert(`Could not copy link automatically. Please copy it manually:\n${shareUrl}`);
    }
  };

  const triggerToast = () => {
    setCopied(true);
    setShowToast(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (authLoading) return null;

  const username = userProfile?.username;
  const profileLink = username ? `/u/${username}` : '#';

  return (
    <div className="space-y-8 relative pb-24 md:pb-0">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="bg-green-500 rounded-full p-1">
               <Check size={12} className="text-black" />
            </div>
            <span className="font-bold text-sm">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between px-1 mb-4 gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            Feed <Sparkles className="text-yellow-500 hidden md:block" size={32} />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm md:text-lg mt-2 max-w-md">
            Welcome back, <span className="text-zinc-900 dark:text-white font-bold">{userProfile?.fullName}</span>. Here is your overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Col */}
        <div className="md:col-span-5 flex flex-col gap-6">
            {/* Hero Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-600 via-rose-600 to-orange-600 p-8 text-white shadow-2xl shadow-pink-900/20 group ring-1 ring-white/10"
            >
                <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Your Link</h2>
                    <p className="text-pink-100 font-medium text-sm leading-relaxed opacity-90">
                        Share this on your Instagram Story or Snapchat.
                    </p>
                  </div>
                
                  <div 
                      className={`bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 transition-all border border-white/10 group/card w-full ${username ? 'cursor-pointer hover:bg-black/30 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
                      onClick={username ? handleShareLink : undefined}
                  >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-pink-600 shadow-lg shrink-0 transition-transform group-active/card:scale-90">
                      {copied ? <Check size={24} className="text-green-600" /> : <Copy size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider mb-0.5">tap to copy</p>
                      <p className="text-sm md:text-base font-bold truncate">
                          {username ? `${window.location.host}/#/u/${username}` : 'Loading...'}
                      </p>
                      </div>
                  </div>
                </div>

                {/* Decor */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/20 transition-all duration-700 pointer-events-none"></div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[24px] flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Answered</span>
                  </div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{loading ? '...' : stats.answers}</span>
               </div>
               <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[24px] flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <Heart size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Likes</span>
                  </div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{loading ? '...' : stats.likes}</span>
               </div>
            </div>

            {/* Quick Access Links */}
            <div className="hidden md:grid grid-cols-2 gap-4">
                <Link to="/inbox" className="group block h-full">
                  <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="h-full bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-[24px] flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                          <Inbox size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-zinc-900 dark:text-white">Inbox</h3>
                         <p className="text-xs text-zinc-500">Check messages</p>
                      </div>
                  </motion.div>
                </Link>
                
                <Link to={profileLink} className="group block h-full">
                  <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="h-full bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-[24px] flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                          <User size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-zinc-900 dark:text-white">Profile</h3>
                         <p className="text-xs text-zinc-500">Public view</p>
                      </div>
                  </motion.div>
                </Link>
            </div>
        </div>

        {/* Right Col: Personal Feed */}
        <div className="md:col-span-7 pt-4 md:pt-0">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Your History</h3>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
            </div>
            
            {loading ? (
                <div className="space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-900 rounded-[24px] animate-pulse"></div>)}
                </div>
            ) : myAnswers.length === 0 ? (
            <div className="text-center py-20 bg-zinc-100 dark:bg-zinc-900/30 rounded-[32px] border border-dashed border-zinc-300 dark:border-zinc-800 h-[400px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                   <Inbox size={32} />
                </div>
                <p className="text-zinc-500 font-medium">You haven't answered any questions yet.</p>
                <Link to="/inbox" className="text-pink-500 font-bold text-sm mt-2 hover:underline">Go to Inbox</Link>
            </div>
            ) : (
            <div className="flex flex-col gap-4">
                {myAnswers.map((item, i) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (Math.min(i, 10) * 0.05) }}
                    className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-[28px] p-8 hover:shadow-lg transition-all group relative overflow-hidden"
                >
                    <div className="flex items-center gap-2 mb-4 opacity-60">
                        <Shield size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question</span>
                    </div>
                    
                    <p className="text-zinc-900 dark:text-white text-2xl font-black leading-tight mb-6">
                        "{item.questionText}"
                    </p>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 block">You Answered</span>
                        <p className="text-zinc-600 dark:text-zinc-300 text-lg font-medium leading-relaxed">
                          {item.answerText}
                        </p>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center text-xs text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl">
                       <span>{timeAgo(item.timestamp)}</span>
                       <span className="flex items-center gap-2">
                           <Heart size={14} className={item.likes > 0 ? "text-pink-500 fill-pink-500" : ""} /> 
                           {item.likes} Likes
                       </span>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Feed;