
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Inbox, User, Loader2, Sparkles, Check, 
  MessageSquare, Heart, Copy, Shield 
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFeed, getUserStats } from '../services/db';
import { Answer } from '../types';
import { timeAgo, copyToClipboard } from '../utils';

const Feed: React.FC = () => {
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
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ask Me',
          text: `Ask @${userProfile?.username} anything anonymously!`,
          url: shareUrl,
        });
        return; 
      } catch (err) { 
        console.log("Share skipped", err);
      }
    }

    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (authLoading) return null;

  return (
    <div className="space-y-10 w-full max-w-full">
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
        {/* Left Column: Stats & Link */}
        <div className="lg:col-span-5 space-y-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-500 via-pink-600 to-orange-500 p-8 text-white shadow-xl group"
            >
                <div className="relative z-10">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Share Link</h2>
                  <p className="text-pink-100 font-medium text-sm mb-8">Get more questions by sharing your link.</p>
                
                  <div 
                      className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 transition-all border border-white/10 w-full cursor-pointer hover:bg-black/30"
                      onClick={handleShareLink}
                  >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pink-600 shadow-lg shrink-0">
                        {copied ? <Check size={24} /> : <Copy size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-black text-white/50 tracking-wider mb-0.5">tap to copy</p>
                        <p className="text-base font-black truncate">
                            {userProfile?.username ? `askme.app/u/${userProfile.username}` : 'Loading...'}
                        </p>
                      </div>
                  </div>
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

        {/* Right Column: Activity */}
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
    </div>
  );
};

export default Feed;
