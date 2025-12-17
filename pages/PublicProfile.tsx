import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getUserByUsername, sendQuestion } from '../services/db';
import { UserProfile } from '../types';
import { Send, Dice5, Shield, Loader2, Share2, Check } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard } from '../utils';
import clsx from 'clsx';

const placeholders = [
  "What's your biggest fear?",
  "Who do you have a crush on?",
  "What's the last song you listened to?",
  "Describe your ideal date.",
  "What's a secret you've never told anyone?"
];

// Theme Options
const THEMES = [
  { id: 'default', name: 'Classic', css: 'bg-zinc-900 border-zinc-700', ring: 'ring-zinc-600' },
  { id: 'fiery', name: 'Fiery', css: 'bg-gradient-to-br from-pink-600 to-orange-600 border-pink-500', ring: 'ring-pink-500' },
  { id: 'ocean', name: 'Ocean', css: 'bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-500', ring: 'ring-cyan-500' },
  { id: 'jungle', name: 'Jungle', css: 'bg-gradient-to-br from-green-600 to-emerald-500 border-emerald-500', ring: 'ring-emerald-500' },
  { id: 'love', name: 'Love', css: 'bg-gradient-to-br from-rose-600 to-pink-500 border-rose-500', ring: 'ring-rose-500' },
  { id: 'midnight', name: 'Midnight', css: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-indigo-500', ring: 'ring-indigo-500' },
];

// Profile Skeleton
const ProfileSkeleton = () => (
    <div className="flex flex-col items-center pt-20 animate-pulse max-w-lg mx-auto w-full px-4">
        <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-6 border-4 border-white dark:border-black"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
        <div className="w-full h-56 bg-zinc-100 dark:bg-zinc-900/50 rounded-[32px]"></div>
    </div>
);

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!username || username === 'undefined') {
          setLoading(false);
          return;
      }
      
      const data = await getUserByUsername(username);
      setProfile(data);
      setLoading(false); 
      
      if (data) {
        document.title = `@${data.username} on Ask Me`;
      }
    };
    loadData();
    return () => { document.title = 'Ask Me - Anonymous Q&A'; };
  }, [username]);

  if (!username || username === 'undefined') return <Navigate to="/" />;

  const handleSend = async () => {
    if (!profile || !questionText.trim()) return;
    setSending(true);
    try {
      await sendQuestion(profile.uid, questionText, selectedTheme);
      setSentSuccess(true);
      setQuestionText('');
      setSelectedTheme('default');
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
            title: `Ask Me: @${profile?.username}`,
            text: 'Ask me anything anonymously!',
            url: url
        });
        return;
      } catch (err) { console.log("Share failed, trying copy"); }
    }
    
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDice = () => {
    const random = placeholders[Math.floor(Math.random() * placeholders.length)];
    setQuestionText(random);
  };

  if (loading) return <div className="min-h-screen"><ProfileSkeleton /></div>;

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-700">
        <Shield size={32} />
      </div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">User not found</h2>
      <p className="text-zinc-500">The username @{username} does not exist.</p>
    </div>
  );

  return (
    <div className="min-h-[80vh] w-full flex flex-col justify-center items-center pb-20 px-4 pt-12 md:pt-0">
      
      {/* Container */}
      <div className="w-full max-w-lg flex flex-col gap-8">
        
        {/* Profile Card */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center p-8 rounded-[32px] bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none backdrop-blur-md relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>

            <div className="relative group cursor-pointer z-10" onClick={handleShare}>
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-orange-500 rounded-full blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-pink-600 to-orange-500 relative z-10 shadow-lg">
                    <img 
                    src={profile.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.username}`} 
                    alt={profile.username} 
                    className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-900 object-cover border-4 border-white dark:border-black"
                    />
                </div>
            </div>
            
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white mt-6 tracking-tight text-center relative z-10">
                {profile.fullName}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm tracking-wide mb-3 relative z-10">@{profile.username}</p>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-sm text-center font-medium leading-relaxed px-2 relative z-10">{profile.bio}</p>
            
            <button 
            onClick={handleShare}
            className="mt-6 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 shadow-sm relative z-10"
            >
            {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
            {copied ? 'Link Copied' : 'Share Profile'}
            </button>
        </motion.div>

        {/* Ask Box */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[32px] p-1 shadow-2xl dark:shadow-black/50 relative overflow-hidden group ring-1 ring-zinc-200 dark:ring-white/10 hover:ring-pink-500/30 transition-all duration-500 bg-white dark:bg-zinc-950"
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-600/5 to-transparent pointer-events-none"></div>
            
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-[28px] p-6 relative z-10">
                <AnimatePresence mode='wait'>
                {sentSuccess ? (
                    <motion.div 
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                    >
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-green-500/30">
                            <Send size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Sent!</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-center">Your secret is safe with us.</p>
                        <button 
                            onClick={() => setSentSuccess(false)}
                            className="mt-6 text-pink-500 font-bold text-sm hover:underline"
                        >
                            Send another
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Ask me anything</h3>
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                            <Shield size={12} className="text-pink-500" />
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Anon</span>
                        </div>
                        </div>

                        <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Send me a secret message..."
                        maxLength={300}
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl p-5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 resize-none h-40 mb-4 text-base transition-all"
                        />
                        
                        {/* Theme Selection */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mr-2 shrink-0">Vibe:</span>
                        {THEMES.map((theme) => (
                            <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme.id)}
                            className={clsx(
                                "w-6 h-6 rounded-full transition-all shrink-0",
                                theme.css,
                                selectedTheme === theme.id ? `ring-2 ${theme.ring} scale-110` : "opacity-50 hover:opacity-100"
                            )}
                            title={theme.name}
                            />
                        ))}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center gap-4">
                            <button 
                            onClick={handleDice}
                            className="w-12 h-12 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 active:scale-95"
                            title="Random Question"
                            >
                            <Dice5 size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                            
                            <button 
                            onClick={handleSend}
                            disabled={!questionText.trim() || sending}
                            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black h-12 rounded-full font-black hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                            {sending ? <Loader2 className="animate-spin" size={20} /> : 'Send'}
                            </button>
                        </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </motion.div>

        {/* Footer info for trust */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 font-medium">
           100% Anonymous. Safe. Free.
        </p>

      </div>
    </div>
  );
};

export default PublicProfile;