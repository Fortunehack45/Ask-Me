import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed, toggleAnswerLike } from '../services/db';
import { UserProfile, Answer } from '../types';
import { Send, Dice5, Shield, Loader2, Heart, Share2, Check, Download, X, Copy } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { timeAgo, getDeviceId, copyToClipboard } from '../utils';
import { toPng } from 'html-to-image';
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

const getDownloadThemeStyles = (theme?: string) => {
  switch (theme) {
    case 'fiery': return 'bg-gradient-to-bl from-pink-500 via-rose-500 to-orange-500';
    case 'ocean': return 'bg-gradient-to-bl from-blue-600 via-sky-500 to-cyan-400';
    case 'jungle': return 'bg-gradient-to-bl from-green-600 via-emerald-500 to-teal-400';
    case 'love': return 'bg-gradient-to-bl from-rose-600 via-pink-500 to-red-400';
    case 'midnight': return 'bg-gradient-to-bl from-indigo-900 via-purple-800 to-slate-900';
    default: return 'bg-gradient-to-bl from-zinc-800 via-zinc-700 to-zinc-600';
  }
};

// Profile Skeleton
const ProfileSkeleton = () => (
    <div className="flex flex-col items-center pt-8 animate-pulse max-w-2xl mx-auto">
        <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-6 border-4 border-white dark:border-black"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
        <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-900/50 rounded-[32px] mb-8"></div>
    </div>
);

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [feed, setFeed] = useState<Answer[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Like state management
  const [likedAnswers, setLikedAnswers] = useState<Set<string>>(new Set());

  // Download Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<Answer | null>(null);
  const [downloadMode, setDownloadMode] = useState<'both' | 'question'>('both');
  const [downloading, setDownloading] = useState(false);
  const [downloadTheme, setDownloadTheme] = useState('default');
  const captureRef = useRef<HTMLDivElement>(null);

  const deviceId = getDeviceId(); // Get persistent device ID for anonymous likes

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
        try {
            const answers = await getUserFeed(data.uid);
            setFeed(answers);
            
            // Check which ones are liked by this user/device
            const currentUserId = user?.uid || deviceId;
            const likedSet = new Set<string>();
            answers.forEach(a => {
              if (a.likedBy?.includes(currentUserId)) {
                likedSet.add(a.id);
              }
            });
            setLikedAnswers(likedSet);

        } catch (e) {
            console.error(e);
        } finally {
            setFeedLoading(false);
        }
      }
    };
    loadData();
    return () => { document.title = 'Ask Me - Anonymous Q&A'; };
  }, [username, user, deviceId]);

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

  const handleLike = async (answerId: string) => {
    const currentUserId = user?.uid || deviceId;
    const isLiked = likedAnswers.has(answerId);
    
    // Optimistic Update
    setLikedAnswers(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(answerId);
      else newSet.add(answerId);
      return newSet;
    });

    setFeed(prev => prev.map(a => {
      if (a.id === answerId) {
        return { ...a, likes: isLiked ? Math.max(0, a.likes - 1) : a.likes + 1 };
      }
      return a;
    }));

    try {
      await toggleAnswerLike(answerId, currentUserId);
    } catch (error) {
      // Revert if fail
      console.error("Like failed", error);
      // Revert UI changes here if needed, but for likes usually silent fail is ok or eventual consistency
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

  const openShareModal = (answer: Answer) => {
    setActiveAnswer(answer);
    setShareModalOpen(true);
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current || !activeAnswer) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, 
        backgroundColor: 'transparent'
      });
      const link = document.createElement('a');
      link.download = `askme-${activeAnswer.authorUsername}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="pb-20"><ProfileSkeleton /></div>;

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-700">
        <Shield size={32} />
      </div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">User not found</h2>
      <p className="text-zinc-500">The username @{username} does not exist.</p>
    </div>
  );

  return (
    <div className="pb-32 md:pb-0 max-w-7xl mx-auto">
      
      {/* Split Layout Container */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
        
        {/* Left Column: Sticky Profile & Ask Box */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 flex flex-col gap-6 shrink-0">
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center p-8 rounded-[32px] bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none backdrop-blur-md"
            >
                <div className="relative group cursor-pointer" onClick={handleShare}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-orange-500 rounded-full blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-pink-600 to-orange-500 relative z-10 shadow-lg">
                        <img 
                        src={profile.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.username}`} 
                        alt={profile.username} 
                        className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-900 object-cover border-4 border-white dark:border-black"
                        />
                    </div>
                </div>
                
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mt-6 tracking-tight text-center">
                    {profile.fullName}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm tracking-wide mb-3">@{profile.username}</p>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-sm text-center font-medium leading-relaxed px-2">{profile.bio}</p>
                
                <button 
                onClick={handleShare}
                className="mt-6 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 shadow-sm"
                >
                {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                {copied ? 'Link Copied' : 'Share Profile'}
                </button>
            </motion.div>

            {/* Input Card */}
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
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Your secret is safe with us.</p>
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
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl p-5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 resize-none h-32 mb-4 text-base transition-all"
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
        </div>

        {/* Right Column: Feed */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex-shrink-0">Recent Answers</h3>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full"></div>
            </div>
            
            <div className="">
                {feedLoading && feed.length === 0 ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900/30 rounded-[32px] animate-pulse"></div>)}
                    </div>
                ) : feed.length === 0 ? (
                <div className="text-center py-16 px-4 bg-zinc-100 dark:bg-zinc-900/20 rounded-[32px] border border-dashed border-zinc-300 dark:border-zinc-800/50">
                    <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-700">
                        <Share2 size={24} />
                    </div>
                    <p className="text-zinc-500 font-medium">No answers yet.</p>
                </div>
                ) : (
                <div className="columns-1 md:columns-2 gap-4 space-y-4">
                  {feed.map((answer, i) => {
                    const isLiked = likedAnswers.has(answer.id);
                    return (
                    <motion.div
                    key={answer.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="break-inside-avoid group mb-4"
                    >
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-[32px] overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:shadow-xl dark:hover:bg-zinc-900/60 transition-all duration-300 backdrop-blur-sm shadow-sm">
                        {/* Question Header */}
                        <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/10 dark:to-zinc-900/30 p-8 border-b border-zinc-100 dark:border-zinc-800/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-orange-500"></div>
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                <Shield size={10} /> Anonymous
                                </p>
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{timeAgo(answer.timestamp)}</span>
                            </div>
                            <p className="text-zinc-900 dark:text-white font-bold text-xl leading-tight">"{answer.questionText}"</p>
                        </div>

                        {/* Answer Body */}
                        <div className="p-8">
                            <div className="flex gap-4 items-start mb-6">
                                <img 
                                    src={profile.avatar} 
                                    className="w-10 h-10 rounded-full bg-black object-cover shrink-0 ring-2 ring-zinc-200 dark:ring-zinc-800" 
                                    alt="Avatar"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1 flex items-center gap-1">
                                        {profile.fullName}
                                        <Check size={14} className="text-blue-500" />
                                    </p>
                                    <p className="text-zinc-800 dark:text-zinc-100 text-base leading-relaxed font-medium">{answer.answerText}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                <button 
                                  onClick={() => openShareModal(answer)}
                                  className="text-zinc-500 text-xs font-bold flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                                >
                                    <Share2 size={12} /> Share
                                </button>
                                <button 
                                  onClick={() => handleLike(answer.id)}
                                  className={clsx(
                                    "text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95",
                                    isLiked 
                                      ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" 
                                      : "text-zinc-500 bg-zinc-100 dark:bg-zinc-900 hover:text-pink-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                  )}
                                >
                                    <Heart size={12} className={isLiked ? "fill-white" : ""} /> {answer.likes || 0}
                                </button>
                            </div>
                        </div>
                    </div>
                    </motion.div>
                  )})}
                </div>
                )}
            </div>
        </div>
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {shareModalOpen && activeAnswer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md"
              onClick={() => setShareModalOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-sm z-10"
            >
              <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                   <h3 className="font-bold text-zinc-900 dark:text-white pl-2">Save Image</h3>
                   <button 
                     onClick={() => setShareModalOpen(false)}
                     className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>

                {/* Capture Area */}
                <div 
                   ref={captureRef}
                   className={clsx(
                     "relative p-8 min-h-[450px] flex flex-col items-center justify-center transition-all duration-500",
                     getDownloadThemeStyles(downloadTheme)
                   )}
                >
                    {/* Background Noise */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                    
                    {/* The content */}
                    <div className="relative z-10 w-full flex flex-col gap-6">
                        {/* Question Card */}
                        <div className="glass bg-white/20 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl w-full text-center transform -rotate-1">
                            <div className="flex justify-center mb-2 opacity-70">
                                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                                <Shield size={14} className="text-white" />
                                </div>
                            </div>
                            <p className="text-white font-black text-xl drop-shadow-md leading-tight">
                                {activeAnswer.questionText}
                            </p>
                        </div>

                        {/* Answer Part (Optional) */}
                        {downloadMode === 'both' && (
                           <div className="flex gap-3 items-start transform rotate-1 bg-black/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
                              <img 
                                src={profile?.avatar} 
                                className="w-10 h-10 rounded-full border border-white/20 object-cover" 
                                alt="" 
                              />
                              <div className="text-left">
                                <p className="text-zinc-400 text-xs font-bold mb-1">{profile?.fullName}</p>
                                <p className="text-white font-medium text-lg leading-snug">{activeAnswer.answerText}</p>
                              </div>
                           </div>
                        )}
                    </div>

                    {/* Branding */}
                    <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-90">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Sent via</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-black flex items-center justify-center text-white font-black text-[10px]">A</span>
                        <span className="text-white font-bold text-sm tracking-tight">Ask Me</span>
                      </div>
                   </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-white dark:bg-zinc-900 space-y-4">
                   <div className="flex justify-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <button 
                        onClick={() => setDownloadMode('both')}
                        className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", downloadMode === 'both' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300')}
                      >
                        Q & A
                      </button>
                      <button 
                        onClick={() => setDownloadMode('question')}
                        className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", downloadMode === 'question' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300')}
                      >
                        Question Only
                      </button>
                   </div>
                   
                   {/* Theme Dots */}
                   <div className="flex justify-center gap-3">
                      {THEMES.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setDownloadTheme(t.id)}
                          className={clsx(
                              "w-6 h-6 rounded-full transition-all border-2",
                              t.css,
                              downloadTheme === t.id ? "border-zinc-400 dark:border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                          )}
                        />
                      ))}
                   </div>

                   <button 
                     onClick={handleDownloadImage}
                     disabled={downloading}
                     className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                   >
                      {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      Save to Gallery
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

export default PublicProfile;