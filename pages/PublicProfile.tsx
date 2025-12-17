import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed } from '../services/db';
import { UserProfile, Answer } from '../types';
import { Send, Dice5, Shield, Loader2, Share2, Check, Download, Image as ImageIcon, Copy, MessageSquare, Heart } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

// Theme Options
const THEMES = [
  { id: 'default', name: 'Classic', css: 'bg-zinc-900 border-zinc-700', ring: 'ring-zinc-600', gradient: 'from-zinc-800 to-zinc-900' },
  { id: 'fiery', name: 'Fiery', css: 'bg-gradient-to-br from-pink-600 to-orange-600 border-pink-500', ring: 'ring-pink-500', gradient: 'from-pink-600 to-orange-600' },
  { id: 'ocean', name: 'Ocean', css: 'bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-500', ring: 'ring-cyan-500', gradient: 'from-blue-600 to-cyan-500' },
  { id: 'jungle', name: 'Jungle', css: 'bg-gradient-to-br from-green-600 to-emerald-500 border-emerald-500', ring: 'ring-emerald-500', gradient: 'from-green-600 to-emerald-500' },
  { id: 'love', name: 'Love', css: 'bg-gradient-to-br from-rose-600 to-pink-500 border-rose-500', ring: 'ring-rose-500', gradient: 'from-rose-600 to-pink-500' },
  { id: 'midnight', name: 'Midnight', css: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-indigo-500', ring: 'ring-indigo-500', gradient: 'from-indigo-900 to-slate-900' },
];

const placeholders = [
  "What's your biggest fear?",
  "Who do you have a crush on?",
  "What's the last song you listened to?",
  "Describe your ideal date.",
  "What's a secret you've never told anyone?"
];

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived State
  const isOwner = user && profile && user.uid === profile.uid;

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

  if (loading) return (
      <div className="flex flex-col items-center pt-20 animate-pulse max-w-lg mx-auto w-full px-4">
        <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-6 border-4 border-white dark:border-black"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
        <div className="w-full h-56 bg-zinc-100 dark:bg-zinc-900/50 rounded-[32px]"></div>
    </div>
  );

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
    <div className="min-h-[80vh] w-full flex flex-col items-center pb-20 px-4 pt-12 md:pt-0">
      
      {/* Profile Header (Shared) */}
      <div className="w-full max-w-lg flex flex-col gap-8">
        <ProfileHeader profile={profile} />

        {/* Conditional View */}
        {isOwner ? (
            <OwnerView profile={profile} />
        ) : (
            <VisitorView profile={profile} />
        )}
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const ProfileHeader = ({ profile }: { profile: UserProfile }) => {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({
                title: `Ask Me: @${profile?.username}`,
                text: `Ask @${profile?.username} anything anonymously!`,
                url: url
            });
            return;
          } catch (e) { console.log('Share failed', e); }
        }
        
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 group">
                <img 
                    src={profile.avatar} 
                    alt={profile.username} 
                    className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-zinc-950 shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-900 p-2 rounded-full shadow-md border border-zinc-100 dark:border-zinc-800">
                    <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
                </div>
            </div>
            
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                {profile.fullName}
                {profile.premiumStatus && <div className="w-5 h-5 bg-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">★</div>}
            </h1>
            <p className="text-zinc-500 font-bold mb-4">@{profile.username}</p>
            
            {profile.bio && (
                <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium max-w-xs leading-relaxed mb-6 bg-zinc-100 dark:bg-zinc-900/50 px-4 py-2 rounded-xl">
                    {profile.bio}
                </p>
            )}

            <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-pink-600 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full transition-all hover:border-pink-500/30 shadow-sm"
            >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Link Copied' : 'Share Profile'}
            </button>
        </div>
    );
};

const VisitorView = ({ profile }: { profile: UserProfile }) => {
    const [text, setText] = useState('');
    const [theme, setTheme] = useState(THEMES[0]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        // Simulate minimum delay for animation feel
        const start = Date.now();
        
        try {
            await sendQuestion(profile.uid, text, theme.id);
            const duration = Date.now() - start;
            if (duration < 800) await new Promise(r => setTimeout(r, 800 - duration));
            setSent(true);
        } catch (e) {
            alert("Failed to send. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleReset = () => {
        setText('');
        setSent(false);
        setTheme(THEMES[0]);
    };

    const randomize = () => {
        const random = placeholders[Math.floor(Math.random() * placeholders.length)];
        setText(random);
    };

    return (
        <div className="w-full relative min-h-[400px]">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="glass-card rounded-[32px] p-1.5 shadow-2xl shadow-pink-900/5 dark:shadow-black/50">
                            <div className={clsx("rounded-[28px] p-6 transition-all duration-500", theme.css)}>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full px-3 py-1 text-white/90">
                                        <Shield size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Anonymous</span>
                                    </div>
                                    <button 
                                        onClick={randomize} 
                                        className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                        title="Random question"
                                    >
                                        <Dice5 size={20} />
                                    </button>
                                </div>
                                
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Send me an anonymous message..."
                                    className="w-full bg-transparent text-white placeholder-white/60 text-xl font-bold border-none focus:ring-0 resize-none min-h-[160px] leading-relaxed selection:bg-white/30"
                                    maxLength={300}
                                />

                                <div className="flex justify-between items-end mt-4">
                                    <div className="flex gap-2">
                                        {THEMES.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-full border-2 transition-all shadow-lg",
                                                    t.css,
                                                    theme.id === t.id ? "border-white scale-110" : "border-transparent hover:scale-110 opacity-70 hover:opacity-100"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className={clsx("text-xs font-bold", text.length > 280 ? "text-red-300" : "text-white/50")}>
                                        {text.length}/300
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || sending}
                            className="w-full mt-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {sending ? 'Sending...' : 'Send Anonymously'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-full text-center py-12"
                    >
                        <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30 text-white">
                            <Check size={48} strokeWidth={4} />
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Sent!</h2>
                        <p className="text-zinc-500 font-medium mb-10">Your message has been delivered securely.</p>
                        
                        <button
                            onClick={handleReset}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold px-8 py-3 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Send Another
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- OWNER VIEW (For the logged-in user viewing their own profile) ---

const OwnerView = ({ profile }: { profile: UserProfile }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Download States
    const [downloadItem, setDownloadItem] = useState<{answer: Answer, type: 'question' | 'full'} | null>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchContent = async () => {
            const data = await getUserFeed(profile.uid);
            setAnswers(data);
            setLoading(false);
        };
        fetchContent();
    }, [profile.uid]);

    // Effect to trigger capture once content is rendered in hidden div
    useEffect(() => {
        if (downloadItem && captureRef.current) {
            const capture = async () => {
                // Short delay to ensure rendering
                await new Promise(r => setTimeout(r, 100));
                
                try {
                    const dataUrl = await toPng(captureRef.current, { 
                        cacheBust: true, 
                        pixelRatio: 3,
                        backgroundColor: 'transparent'
                    });
                    
                    const link = document.createElement('a');
                    link.download = `askme-${downloadItem.type}-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                } catch (err) {
                    console.error('Download failed', err);
                    alert("Could not generate image. Try again.");
                } finally {
                    setDownloadItem(null);
                }
            };
            capture();
        }
    }, [downloadItem]);

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    if (answers.length === 0) return (
        <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 font-bold mb-2">No answered questions yet.</p>
            <p className="text-xs text-zinc-400">Answer questions in your inbox to show them here.</p>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">Your Answers</h3>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {answers.map(ans => (
                    <motion.div 
                        key={ans.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <Shield size={14} className="text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">"{ans.questionText}"</p>
                            </div>
                        </div>
                        
                        <div className="pl-11">
                            <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mb-6">
                                {ans.answerText}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setDownloadItem({ answer: ans, type: 'question' })}
                                    disabled={!!downloadItem}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                                >
                                    <ImageIcon size={14} />
                                    Save Question
                                </button>
                                <button 
                                    onClick={() => setDownloadItem({ answer: ans, type: 'full' })}
                                    disabled={!!downloadItem}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                                >
                                    <Download size={14} />
                                    Save Q&A
                                </button>
                            </div>
                            
                            <div className="mt-4 flex items-center gap-4 text-xs font-bold text-zinc-400">
                                <span>{timeAgo(ans.timestamp)}</span>
                                <span className="flex items-center gap-1"><Heart size={12} /> {ans.likes}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- HIDDEN CAPTURE AREA --- */}
            {/* This renders the content off-screen to generate the image */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                {downloadItem && (
                    <div ref={captureRef} className={clsx(
                        "w-[600px] p-12 flex flex-col items-center justify-center relative bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black text-white",
                        downloadItem.type === 'question' ? 'min-h-[600px] text-center' : 'min-h-[auto] rounded-none'
                    )}>
                        {/* Background Texture */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

                        {/* Branding */}
                        <div className="absolute top-8 flex items-center gap-2 opacity-50">
                            <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-black font-black text-xs">A</div>
                            <span className="font-bold tracking-widest text-sm uppercase">Ask Me</span>
                        </div>

                        {downloadItem.type === 'question' ? (
                            // STORY STYLE (Question Only)
                            <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl rotate-1 max-w-md">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-black/40 p-3 rounded-full">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black leading-tight drop-shadow-lg">
                                    "{downloadItem.answer.questionText}"
                                </h2>
                                <p className="mt-6 text-sm font-bold text-white/60 uppercase tracking-widest">Send me anonymous messages</p>
                            </div>
                        ) : (
                            // POST STYLE (Full Q&A)
                            <div className="relative z-10 w-full">
                                {/* Question Part */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl mb-4">
                                    <div className="flex items-center gap-3 mb-2 opacity-70">
                                        <Shield size={16} />
                                        <span className="text-xs font-bold uppercase">Anonymous Question</span>
                                    </div>
                                    <p className="text-2xl font-bold">"{downloadItem.answer.questionText}"</p>
                                </div>

                                {/* Answer Part */}
                                <div className="flex gap-4 mt-6">
                                    <img src={profile.avatar} className="w-16 h-16 rounded-full border-2 border-white/20" alt="Avatar" />
                                    <div>
                                        <p className="font-bold text-lg mb-1">{profile.fullName}</p>
                                        <p className="text-xl leading-relaxed text-zinc-200">{downloadItem.answer.answerText}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Footer URL */}
                        <div className="absolute bottom-8 text-white/40 font-mono text-xs">
                             askme.app/u/{profile.username}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;