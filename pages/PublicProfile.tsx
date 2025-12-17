import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed } from '../services/db';
import { UserProfile, Answer } from '../types';
import { Send, Dice5, Shield, Loader2, Share2, Check, Download, Image as ImageIcon, Heart, Zap, Sparkles } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

// Refined Theme Options with gradients
const THEMES = [
  { id: 'default', name: 'Noir', css: 'bg-zinc-900', gradient: 'from-zinc-800 to-black', text: 'text-white' },
  { id: 'crimson', name: 'Crimson', css: 'bg-rose-900', gradient: 'from-rose-600 to-red-900', text: 'text-white' },
  { id: 'ocean', name: 'Ocean', css: 'bg-blue-900', gradient: 'from-blue-600 to-indigo-900', text: 'text-white' },
  { id: 'forest', name: 'Forest', css: 'bg-emerald-900', gradient: 'from-emerald-600 to-teal-900', text: 'text-white' },
  { id: 'sunset', name: 'Sunset', css: 'bg-orange-900', gradient: 'from-orange-500 to-pink-700', text: 'text-white' },
  { id: 'lavender', name: 'Lavender', css: 'bg-violet-900', gradient: 'from-violet-500 to-purple-900', text: 'text-white' },
];

const placeholders = [
  "What is your honest opinion on...",
  "What's the last thing you lied about?",
  "Who is your secret crush?",
  "What's your biggest regret?",
  "Tell me a secret nobody knows.",
  "What's the wildest thing you've ever done?"
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
        document.title = `@${data.username} | Ask Me`;
      }
    };
    loadData();
    return () => { document.title = 'Ask Me'; };
  }, [username]);

  if (!username || username === 'undefined') return <Navigate to="/" />;

  if (loading) return (
      <div className="flex flex-col items-center pt-32 animate-pulse w-full">
        <div className="w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-800/50 mb-8"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg mb-4"></div>
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-400">
        <Shield size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Profile not found</h2>
      <p className="text-zinc-500">The user @{username} doesn't seem to exist.</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center pb-20 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-4xl flex flex-col gap-10 pt-16 md:pt-20 relative z-10">
        <ProfileHeader profile={profile} />

        <div className="transition-all duration-500 ease-out">
            {isOwner ? (
                <OwnerView profile={profile} />
            ) : (
                <VisitorView profile={profile} />
            )}
        </div>
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
                title: `Ask @${profile.username}`,
                text: `Send me an anonymous message!`,
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
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-6 group cursor-default"
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <img 
                    src={profile.avatar} 
                    alt={profile.username} 
                    className="relative w-32 h-32 rounded-full object-cover border-[6px] border-white dark:border-zinc-950 shadow-2xl"
                />
                {/* Premium Badge if applicable */}
                {profile.premiumStatus && (
                    <div className="absolute -right-1 bottom-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-1.5 rounded-full border-4 border-white dark:border-zinc-950 shadow-sm" title="Premium User">
                        <Sparkles size={14} fill="white" />
                    </div>
                )}
            </motion.div>
            
            <motion.div
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                    {profile.fullName}
                </h1>
                <p className="text-zinc-500 font-bold text-sm mb-5 tracking-wide bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1 rounded-full inline-block border border-zinc-200 dark:border-zinc-800">
                    @{profile.username}
                </p>
                
                {profile.bio && (
                    <p className="text-zinc-600 dark:text-zinc-300 text-base font-medium max-w-sm leading-relaxed mb-6 mx-auto">
                        {profile.bio}
                    </p>
                )}

                <button 
                    onClick={handleShare}
                    className="group flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-full transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm backdrop-blur-sm mx-auto active:scale-95"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} className="group-hover:text-pink-500 transition-colors" />}
                    {copied ? 'Link Copied' : 'Share Profile'}
                </button>
            </motion.div>
        </div>
    );
};

const VisitorView = ({ profile }: { profile: UserProfile }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [theme, setTheme] = useState(THEMES[0]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        const start = Date.now();
        
        try {
            await sendQuestion(profile.uid, text, theme.id);
            // Minimum loading time for UX
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
        if (textareaRef.current) textareaRef.current.focus();
    };

    return (
        <div className="w-full relative min-h-[500px]">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full"
                    >
                        {/* Card Container */}
                        <div className="relative group">
                            {/* Animated Border Gradient */}
                            <div className={clsx(
                                "absolute -inset-0.5 rounded-[34px] opacity-75 blur transition duration-1000 group-hover:duration-200 bg-gradient-to-r",
                                theme.gradient
                            )}></div>
                            
                            <div className="relative bg-zinc-900 dark:bg-black rounded-[32px] p-1.5 shadow-2xl">
                                <div className={clsx("rounded-[28px] p-6 sm:p-8 transition-colors duration-500 relative overflow-hidden min-h-[240px] flex flex-col", theme.css)}>
                                    
                                    {/* Noise Texture */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

                                    {/* Header Controls */}
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/5">
                                            <Shield size={12} className="text-white/80" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Anonymous</span>
                                        </div>
                                        <button 
                                            onClick={randomize} 
                                            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full active:rotate-180 duration-500"
                                            title="Shuffle question"
                                        >
                                            <Dice5 size={20} />
                                        </button>
                                    </div>
                                    
                                    <textarea
                                        ref={textareaRef}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Send me an anonymous message..."
                                        className="w-full bg-transparent text-white placeholder-white/50 text-xl sm:text-2xl font-bold border-none focus:ring-0 resize-none flex-1 leading-relaxed selection:bg-white/30 p-0"
                                        maxLength={300}
                                    />

                                    <div className="flex justify-between items-end mt-6 relative z-10">
                                        <div className="flex gap-2">
                                            {THEMES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t)}
                                                    className={clsx(
                                                        "w-6 h-6 rounded-full transition-all duration-300 shadow-lg border-2",
                                                        t.css,
                                                        theme.id === t.id 
                                                            ? "border-white scale-110 ring-2 ring-white/20" 
                                                            : "border-transparent hover:scale-110 opacity-60 hover:opacity-100"
                                                    )}
                                                    aria-label={`Select ${t.name} theme`}
                                                />
                                            ))}
                                        </div>
                                        <span className={clsx("text-xs font-bold font-mono", text.length > 280 ? "text-red-300" : "text-white/40")}>
                                            {text.length}/300
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || sending}
                            className="w-full mt-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg py-4 rounded-[20px] shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {sending ? <Loader2 className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
                                {sending ? 'Sending...' : 'Send Anonymously'}
                            </span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-full text-center py-12 px-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[32px] shadow-sm backdrop-blur-sm"
                    >
                        <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 text-white relative">
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                transition={{ delay: 0.2, type: 'spring' }}
                            >
                                <Check size={40} strokeWidth={4} />
                            </motion.div>
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Sent!</h2>
                        <p className="text-zinc-500 font-medium mb-8 max-w-xs mx-auto leading-relaxed">Your message is safely on its way to {profile.fullName}.</p>
                        
                        <button
                            onClick={handleReset}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold px-8 py-3.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
                        >
                            Send Another
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA for Visitors */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                className="mt-12 flex flex-col items-center text-center"
            >
                <div className="mb-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">Join the fun</p>
                    <p className="text-zinc-900 dark:text-white font-bold text-lg">👇 Want to receive secret messages?</p>
                </div>
                
                <Link 
                    to={user ? "/" : "/auth"}
                    className="group relative inline-flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg px-8 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity"></div>
                    <Sparkles size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                    <span className="relative z-10">Get your own link</span>
                </Link>
            </motion.div>
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
                await new Promise(r => setTimeout(r, 100)); // wait for render
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
        <div className="py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 w-full">
            <p className="text-zinc-500 font-bold mb-2 text-lg">No answered questions yet</p>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto">When you answer questions in your inbox, they will appear publicly here.</p>
        </div>
    );

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent"></div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recent Answers</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {answers.map((ans, i) => (
                    <motion.div 
                        key={ans.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700 backdrop-blur-sm"
                    >
                        {/* Question Bubble */}
                        <div className="mb-6 relative">
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="pl-4">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Anonymous Asked</span>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">
                                    {ans.questionText}
                                </h3>
                            </div>
                        </div>
                        
                        {/* Answer Content */}
                        <div className="pl-4">
                            <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed text-lg mb-6">
                                {ans.answerText}
                            </p>
                            
                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                                <button 
                                    onClick={() => setDownloadItem({ answer: ans, type: 'question' })}
                                    disabled={!!downloadItem}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700/50"
                                >
                                    <ImageIcon size={14} />
                                    <span>Story</span>
                                </button>
                                <button 
                                    onClick={() => setDownloadItem({ answer: ans, type: 'full' })}
                                    disabled={!!downloadItem}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700/50"
                                >
                                    <Download size={14} />
                                    <span>Post</span>
                                </button>

                                <div className="ml-auto flex items-center gap-4 text-xs font-medium text-zinc-400">
                                    <span>{timeAgo(ans.timestamp)}</span>
                                    <span className="flex items-center gap-1"><Heart size={14} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : ""} /> {ans.likes}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- HIDDEN CAPTURE AREA --- */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                {downloadItem && (
                    <div ref={captureRef} className={clsx(
                        "w-[600px] p-12 flex flex-col items-center justify-center relative bg-zinc-950 text-white overflow-hidden",
                        downloadItem.type === 'question' ? 'min-h-[600px] text-center' : 'min-h-[auto] rounded-none'
                    )}>
                        {/* Abstract Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0"></div>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-30 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>

                        {/* Branding */}
                        <div className="absolute top-10 flex items-center gap-2 opacity-60 z-20">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg">A</div>
                            <span className="font-bold tracking-widest text-sm uppercase">Ask Me</span>
                        </div>

                        {downloadItem.type === 'question' ? (
                            // STORY STYLE
                            <div className="relative z-10 p-10 max-w-md">
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[40px] shadow-2xl rotate-2">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-gradient-to-tr from-pink-500 to-orange-500 p-3 rounded-2xl shadow-lg">
                                            <Shield size={28} className="text-white" fill="currentColor" fillOpacity={0.2} />
                                        </div>
                                    </div>
                                    <h2 className="text-4xl font-black leading-tight drop-shadow-lg mb-2">
                                        {downloadItem.answer.questionText}
                                    </h2>
                                </div>
                                <div className="mt-8 flex items-center justify-center gap-3">
                                    <div className="h-px w-8 bg-white/30"></div>
                                    <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Send me anonymous messages</p>
                                    <div className="h-px w-8 bg-white/30"></div>
                                </div>
                            </div>
                        ) : (
                            // POST STYLE
                            <div className="relative z-10 w-full pt-8">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl mb-6 shadow-xl relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-orange-500"></div>
                                     <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Question</span>
                                     <p className="text-3xl font-bold leading-tight">{downloadItem.answer.questionText}</p>
                                </div>

                                <div className="flex gap-5 mt-8 px-2">
                                    <img src={profile.avatar} className="w-20 h-20 rounded-full border-4 border-zinc-800 shadow-xl" alt="Avatar" />
                                    <div>
                                        <p className="font-bold text-xl mb-2 text-white">{profile.fullName}</p>
                                        <p className="text-2xl leading-relaxed text-zinc-300 font-medium">{downloadItem.answer.answerText}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Footer URL */}
                        <div className="absolute bottom-10 text-white/30 font-mono text-xs tracking-wider z-20 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                             askme.app/u/{profile.username}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;