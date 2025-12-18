
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed, deleteAnswer, updateAnswerVisibility } from '../services/db';
import { UserProfile, Answer } from '../types';
import { Send, Dice5, Shield, Loader2, Share2, Check, Download, Image as ImageIcon, Heart, Sparkles, ImageDown, Trash2, Lock, Eye, Palette, X } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

const THEMES = [
  { id: 'noir', name: 'Noir', css: 'bg-zinc-900', gradient: 'from-zinc-800 via-zinc-900 to-black', text: 'text-white' },
  { id: 'crimson', name: 'Crimson', css: 'bg-rose-900', gradient: 'from-rose-500 via-pink-600 to-rose-900', text: 'text-white' },
  { id: 'ocean', name: 'Ocean', css: 'bg-blue-900', gradient: 'from-blue-400 via-indigo-600 to-blue-900', text: 'text-white' },
  { id: 'aurora', name: 'Aurora', css: 'bg-emerald-900', gradient: 'from-emerald-400 via-teal-500 to-emerald-900', text: 'text-white' },
  { id: 'sunset', name: 'Sunset', css: 'bg-orange-900', gradient: 'from-orange-400 via-pink-500 to-rose-600', text: 'text-white' },
  { id: 'nebula', name: 'Nebula', css: 'bg-purple-900', gradient: 'from-violet-400 via-purple-600 to-indigo-900', text: 'text-white' },
  { id: 'lemonade', name: 'Lemonade', css: 'bg-yellow-400', gradient: 'from-yellow-300 via-orange-400 to-amber-600', text: 'text-zinc-900' },
  { id: 'midnight', name: 'Midnight', css: 'bg-slate-900', gradient: 'from-slate-800 via-slate-950 to-black', text: 'text-white' },
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
        <div className="w-40 h-40 rounded-full bg-zinc-200 dark:bg-zinc-800/50 mb-8"></div>
        <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl mb-4"></div>
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mb-6 text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800">
        <Shield size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-3 tracking-tighter">Identity Not Found</h2>
      <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">The user @{username} doesn't exist or has gone anonymous.</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center pb-24 relative overflow-hidden">
      {/* Dynamic Brand Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-pink-500/10 via-transparent to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="w-full max-w-6xl flex flex-col gap-16 pt-20 md:pt-28 relative z-10">
        <ProfileHeader profile={profile} />
        <div className="transition-all duration-700 ease-out">
            {isOwner ? <OwnerView profile={profile} /> : <VisitorView profile={profile} />}
        </div>
      </div>
    </div>
  );
};

const ProfileHeader = ({ profile }: { profile: UserProfile }) => {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({
                title: `Whisper to @${profile.username}`,
                text: `Send me an anonymous message!`,
                url: url
            });
            return;
          } catch (e) { /* fallback to copy */ }
        }
        
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center text-center px-4">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-10 group cursor-default"
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-700"></div>
                <img src={profile.avatar} alt={profile.username} className="relative w-44 h-44 md:w-56 md:h-56 rounded-full object-cover border-[12px] border-white dark:border-zinc-950 shadow-2xl transition-all group-hover:scale-[1.05] duration-700 ring-1 ring-zinc-200 dark:ring-white/10" />
                {profile.premiumStatus && (
                    <div className="absolute -right-2 bottom-4 bg-mesh-pink text-white p-4 rounded-[28px] border-8 border-white dark:border-zinc-950 shadow-2xl">
                        <Sparkles size={24} fill="white" />
                    </div>
                )}
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight">{profile.fullName}</h1>
                <div className="flex flex-col items-center gap-4">
                    <p className="text-pink-600 dark:text-pink-400 font-black text-xl md:text-2xl tracking-wide bg-pink-500/10 dark:bg-pink-500/20 px-8 py-2.5 rounded-full inline-block border border-pink-500/20">@{profile.username}</p>
                    {profile.bio && <p className="text-zinc-600 dark:text-zinc-300 text-xl md:text-2xl font-medium max-w-xl leading-relaxed mx-auto">{profile.bio}</p>}
                </div>
                <div className="pt-6">
                    <button onClick={handleShare} className="group flex items-center gap-5 text-lg font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-12 py-5 rounded-[32px] transition-all shadow-xl hover:shadow-2xl active:scale-95 hover:-translate-y-1">
                        {copied ? <Check size={24} className="text-green-500" /> : <Share2 size={24} className="group-hover:text-pink-500 transition-colors" />}
                        {copied ? 'Link Copied' : 'Share Whisper Link'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const VisitorView = ({ profile }: { profile: UserProfile }) => {
    // Add useAuth to fix "Cannot find name 'user'" error
    const { user } = useAuth();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [text, setText] = useState('');
    const [theme, setTheme] = useState(THEMES[0]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchAnswers = async () => {
            const data = await getUserFeed(profile.uid);
            setAnswers(data);
        };
        fetchAnswers();
    }, [profile.uid]);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await sendQuestion(profile.uid, text, theme.id);
            setSent(true);
        } catch (e) {
            alert("Failed to send whisper.");
        } finally {
            setSending(false);
        }
    };

    const randomize = () => {
        const random = placeholders[Math.floor(Math.random() * placeholders.length)];
        setText(random);
        if (textareaRef.current) textareaRef.current.focus();
    };

    return (
        <div className="w-full relative min-h-[600px] px-4 md:px-8">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -30 }}>
                        <div className="relative group max-w-4xl mx-auto">
                            <div className={clsx("absolute -inset-2 rounded-[64px] opacity-75 blur-3xl transition duration-1000 bg-gradient-to-r", theme.gradient)}></div>
                            <div className="relative bg-zinc-950 rounded-[60px] p-2.5 shadow-2xl">
                                <div className={clsx("rounded-[52px] p-12 md:p-20 relative overflow-hidden min-h-[400px] flex flex-col transition-all duration-1000 bg-gradient-to-br", theme.gradient)}>
                                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                                    <div className="flex justify-between items-center mb-12 relative z-10">
                                        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl rounded-full px-6 py-3 border border-white/20 shadow-xl">
                                            <Shield size={18} className="text-white" />
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Encrypted Whisper</span>
                                        </div>
                                        <button onClick={randomize} className="text-white/80 hover:text-white transition-all p-4 hover:bg-white/15 rounded-full active:rotate-180 duration-1000 shadow-lg">
                                            <Dice5 size={32} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    <textarea 
                                      ref={textareaRef} 
                                      value={text} 
                                      onChange={(e) => setText(e.target.value)} 
                                      placeholder="Whisper something anonymous..." 
                                      className="w-full bg-transparent text-white placeholder-white/30 text-4xl md:text-5xl font-black border-none focus:ring-0 resize-none flex-1 leading-tight selection:bg-white/30 p-0" 
                                      maxLength={300} 
                                    />
                                    <div className="flex justify-between items-end mt-16 relative z-10">
                                        <div className="flex gap-4 p-2.5 bg-black/30 backdrop-blur-2xl rounded-full border border-white/10 shadow-xl">
                                            {THEMES.slice(0, 7).map(t => (
                                                <button key={t.id} onClick={() => setTheme(t)} className={clsx("w-8 h-8 rounded-full border-2 transition-all hover:scale-125", t.css, theme.id === t.id ? "border-white scale-125 shadow-2xl" : "border-transparent opacity-60")} />
                                            ))}
                                        </div>
                                        <span className={clsx("text-xs font-black font-mono tracking-widest uppercase", text.length > 280 ? "text-red-300" : "text-white/40")}>{text.length}/300</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-4xl mx-auto mt-12">
                            <button onClick={handleSend} disabled={!text.trim() || sending} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-3xl py-8 rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] hover:-translate-y-2 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-6">
                                {sending ? <Loader2 className="animate-spin" size={32} /> : <Send size={32} strokeWidth={3} />}
                                {sending ? 'Whispering...' : 'Send Whisper'}
                            </button>
                            <p className="text-center text-zinc-400 dark:text-zinc-500 font-bold mt-8 text-sm uppercase tracking-widest">Sent anonymously to @{profile.username}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl mx-auto text-center py-28 px-12 bg-white dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800 rounded-[64px] shadow-2xl backdrop-blur-3xl">
                        <div className="w-32 h-32 bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-12 shadow-[0_30px_60px_rgba(16,185,129,0.4)] text-white relative overflow-hidden">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="relative z-10"><Check size={64} strokeWidth={4} /></motion.div>
                        </div>
                        <h2 className="text-6xl font-black text-zinc-900 dark:text-white mb-6 tracking-tighter">Whisper Sent!</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-16 text-2xl max-w-md mx-auto leading-relaxed">Your message is safely hidden in @{profile.username}'s inbox.</p>
                        <button onClick={() => setSent(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black px-16 py-6 rounded-[32px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-xl text-xl">Send Another Secret</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-32 space-y-16">
                <div className="flex items-center gap-10 mb-12 px-4">
                    <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter shrink-0">Answer Feed</h3>
                    <div className="h-0.5 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent flex-1"></div>
                </div>
                
                {answers.length === 0 ? (
                    <div className="py-32 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-4 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-[64px]">
                        <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-xl">Silence Speaks Volumes</p>
                        <p className="text-zinc-500 mt-4 font-bold text-lg">No public answers from this user yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12">
                        {answers.map(ans => (
                            <motion.div key={ans.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[52px] p-12 md:p-16 shadow-xl transition-all backdrop-blur-3xl overflow-hidden relative group">
                                {!ans.isPublic ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-[32px] flex items-center justify-center text-zinc-400 mb-8 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                            <Lock size={40} />
                                        </div>
                                        <p className="text-zinc-400 font-black text-sm tracking-[0.4em] uppercase">Private Encryption</p>
                                        <p className="text-zinc-500 font-medium mt-4 text-xl">Answer locked by owner.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-12 relative z-10">
                                            <span className="text-[12px] font-black text-pink-500 uppercase tracking-[0.4em] mb-6 block">Anonymous Question</span>
                                            <h3 className="text-4xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">{ans.questionText}</h3>
                                        </div>
                                        <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800/80">
                                            <p className="text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed text-2xl md:text-3xl mb-12">{ans.answerText}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{timeAgo(ans.timestamp)}</span>
                                                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 px-7 py-3 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                  <Heart size={22} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : "text-zinc-400"} /> 
                                                  <span className="dark:text-white text-base font-black">{ans.likes} Likes</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-40 flex flex-col items-center text-center p-20 bg-gradient-to-br from-zinc-900 to-black rounded-[72px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] group-hover:scale-150 transition-transform duration-1000"></div>
                <p className="text-white font-black text-4xl md:text-5xl tracking-tighter mb-6 relative z-10 leading-none">Ready for your own whispers?</p>
                <p className="text-zinc-400 font-medium mb-16 text-2xl max-w-lg relative z-10 leading-relaxed">Join @{profile.username} and thousands of others building their secret brands.</p>
                <Link to={user ? "/" : "/auth"} className="group relative inline-flex items-center gap-6 bg-white text-black font-black text-2xl md:text-3xl px-16 py-7 rounded-[40px] shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Sparkles size={32} className="text-pink-500" />
                    Create My Profile
                </Link>
            </motion.div>
        </div>
    );
};

const OwnerView = ({ profile }: { profile: UserProfile }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{answer?: Answer, type: 'question' | 'full' | 'profile'} | null>(null);
    const [customTheme, setCustomTheme] = useState(THEMES[0]);
    const [downloading, setDownloading] = useState(false);
    
    // Dedicated ref for the off-screen capture node to avoid crushing
    const captureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchContent = async () => {
            const data = await getUserFeed(profile.uid);
            setAnswers(data);
            setLoading(false);
        };
        fetchContent();
    }, [profile.uid]);

    const handleDownload = async () => {
        if (!captureRef.current) return;
        setDownloading(true);
        try {
            // Using a high pixel ratio and fixed dimensions for studio-quality rendering
            const dataUrl = await toPng(captureRef.current, { 
              cacheBust: true, 
              pixelRatio: 4, 
              backgroundColor: 'transparent',
              width: 1080,
              height: 1920
            });
            const link = document.createElement('a');
            link.download = `AskMe-${downloadItem?.type}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            setDownloadItem(null);
        } catch (err) {
            console.error('Download error', err);
        } finally {
            setDownloading(false);
        }
    };

    const handleDeleteAnswer = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this whisper forever?")) return;
        try {
            await deleteAnswer(id);
            setAnswers(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            alert("Delete failed.");
        }
    };

    const handleTogglePrivacy = async (answer: Answer) => {
        const newPublic = !answer.isPublic;
        try {
            await updateAnswerVisibility(answer.id, newPublic);
            setAnswers(prev => prev.map(a => a.id === answer.id ? { ...a, isPublic: newPublic } : a));
        } catch (e) {
            alert("Failed to update visibility.");
        }
    };

    if (loading) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-pink-500" size={48} /></div>;

    return (
        <div className="w-full space-y-16 px-4 md:px-8">
            {/* STUDIO RENDER ENGINE: Hidden fixed-res container */}
            <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
                <div ref={captureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", customTheme.gradient)}>
                     <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                     <div className="absolute top-24 flex flex-col items-center gap-8">
                        <div className="w-28 h-28 rounded-[36px] bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                          <Shield size={56} className="text-white" />
                        </div>
                        <span className="text-white font-black uppercase tracking-[0.6em] text-xl">Official Studio Asset</span>
                     </div>
                     
                     {downloadItem?.type === 'profile' && (
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-72 h-72 rounded-full border-[14px] border-white/20 mb-16 overflow-hidden shadow-2xl ring-32 ring-black/10">
                                <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            <div className="bg-white/10 backdrop-blur-[80px] border border-white/30 p-24 rounded-[100px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] rotate-3 w-full">
                                <h2 className={clsx("font-black text-7xl leading-tight drop-shadow-2xl", customTheme.text)}>Drop a secret message!</h2>
                            </div>
                        </div>
                     )}

                     {downloadItem?.type === 'question' && downloadItem.answer && (
                        <div className="relative z-10 w-full">
                            <div className="bg-white/10 backdrop-blur-[80px] border border-white/30 p-24 rounded-[100px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] rotate-3">
                                <h2 className={clsx("font-black text-7xl leading-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</h2>
                            </div>
                        </div>
                     )}

                     {downloadItem?.type === 'full' && downloadItem.answer && (
                        <div className="relative z-10 w-full py-16">
                            <div className="bg-white/10 border border-white/20 p-24 rounded-[100px] mb-16 shadow-[0_40px_100px_rgba(0,0,0,0.5)] text-left backdrop-blur-[80px] rotate-2">
                                <p className={clsx("font-black text-7xl leading-tight tracking-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</p>
                            </div>
                            <div className="flex gap-10 items-start px-8 text-left bg-black/40 p-16 rounded-[80px] backdrop-blur-[80px] border border-white/15 shadow-2xl">
                                <img src={profile.avatar} className="w-32 h-32 rounded-full border-[8px] border-white/20 shadow-2xl" alt="Avatar" />
                                <div className="flex-1">
                                    <p className={clsx("font-black text-3xl uppercase tracking-[0.4em] mb-4 opacity-60", customTheme.text)}>{profile.fullName}</p>
                                    <p className={clsx("text-6xl leading-tight font-black", customTheme.text)}>{downloadItem.answer.answerText}</p>
                                </div>
                            </div>
                        </div>
                     )}

                     <div className="absolute bottom-24 flex flex-col items-center gap-10">
                         <div className="bg-black/50 backdrop-blur-3xl px-16 py-8 rounded-full border border-white/10 shadow-2xl">
                            <p className="text-white font-black text-4xl tracking-tight">
                              askme.app/u/{profile.username}
                            </p>
                         </div>
                     </div>
                </div>
            </div>

            {/* Billion-Dollar Header */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-[64px] p-12 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-mesh-pink opacity-10 transition-opacity group-hover:opacity-15 duration-1000"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[140px] transition-transform duration-1000 group-hover:scale-125"></div>
                <div className="flex-1 text-center lg:text-left relative z-10">
                    <h3 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">Studio Assets</h3>
                    <p className="text-zinc-400 font-bold text-2xl leading-relaxed max-w-xl">Download premium 4K assets designed specifically for IG, Snapchat and TikTok stories.</p>
                </div>
                <button 
                    onClick={() => setDownloadItem({ type: 'profile' })} 
                    className="shrink-0 bg-white hover:bg-zinc-100 text-black font-black px-16 py-7 rounded-[36px] shadow-2xl transition-all flex items-center gap-6 active:scale-95 text-2xl hover:-translate-y-1"
                >
                    <ImageDown size={36} />
                    Export Studio Post
                </button>
            </div>

            <div className="flex items-center gap-10 py-8 px-2">
                <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter shrink-0">Studio Feed</h3>
                <div className="h-0.5 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent flex-1"></div>
            </div>

            {answers.length === 0 ? (
                <div className="py-40 text-center bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[72px] border-4 border-dashed border-zinc-100 dark:border-zinc-800/80 w-full flex flex-col items-center justify-center">
                    <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-2xl mb-6 opacity-50">Empty Studio</p>
                    <Link to="/inbox" className="text-pink-500 font-black text-xl underline hover:text-pink-600 transition-colors">Go whisper an answer</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-12">
                    {answers.map((ans, i) => (
                        <motion.div key={ans.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[56px] p-12 md:p-20 shadow-xl transition-all backdrop-blur-3xl group relative hover:shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="mb-12 relative flex flex-col lg:flex-row justify-between items-start gap-8">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-6 mb-6">
                                        <span className="text-[12px] font-black text-pink-500 uppercase tracking-[0.4em] block">Anonymous Whisper</span>
                                        <button 
                                            onClick={() => handleTogglePrivacy(ans)}
                                            className={clsx(
                                                "flex items-center gap-4 px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all",
                                                ans.isPublic 
                                                    ? "bg-pink-500/10 text-pink-500 border-pink-500/20 shadow-sm" 
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                            )}
                                        >
                                            {ans.isPublic ? <Eye size={16} /> : <Lock size={16} />}
                                            {ans.isPublic ? 'Publicly Visible' : 'Hidden from feed'}
                                        </button>
                                    </div>
                                    <h3 className="text-4xl font-black text-zinc-900 dark:text-white leading-tight tracking-tighter drop-shadow-sm">{ans.questionText}</h3>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteAnswer(e, ans.id)}
                                    className="p-5 rounded-[24px] hover:bg-red-500/15 text-zinc-300 hover:text-red-500 transition-all active:scale-90"
                                    title="Delete Forever"
                                >
                                    <Trash2 size={32} />
                                </button>
                            </div>
                            <div className="space-y-12">
                                <p className="text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed text-3xl mb-4">{ans.answerText}</p>
                                <div className="flex flex-wrap items-center gap-6 pt-12 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'question' })} className="flex items-center gap-5 px-10 py-5 rounded-[28px] bg-zinc-900 dark:bg-white text-white dark:text-black text-base font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 hover:-translate-y-0.5"><ImageIcon size={24} /><span>Question Asset</span></button>
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'full' })} className="flex items-center gap-5 px-10 py-5 rounded-[28px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-base font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700 transition-all shadow-md active:scale-95 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:-translate-y-0.5"><span>Full Story Post</span></button>
                                    <div className="lg:ml-auto flex items-center gap-8 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                                        <span>{timeAgo(ans.timestamp)}</span>
                                        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 px-6 py-3 rounded-full border border-zinc-100 dark:border-zinc-800">
                                          <Heart size={24} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : "text-zinc-400"} /> 
                                          <span className="dark:text-white text-base">{ans.likes} Likes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Studio Asset Creator Modal */}
            <AnimatePresence>
                {downloadItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/98 backdrop-blur-3xl" onClick={() => setDownloadItem(null)} />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                            className="relative bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[64px] overflow-hidden flex flex-col shadow-[0_0_250px_rgba(0,0,0,0.8)]"
                        >
                            <div className="p-12 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[28px] bg-mesh-pink text-white flex items-center justify-center shadow-2xl"><Palette size={32} /></div>
                                    <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Studio Asset Creator</h3>
                                </div>
                                <button onClick={() => setDownloadItem(null)} className="p-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full transition-all active:scale-90"><X size={32} /></button>
                            </div>

                            <div className="p-12 flex flex-col items-center max-h-[65vh] overflow-y-auto no-scrollbar">
                                <div className="flex flex-wrap justify-center gap-5 mb-14 bg-zinc-100 dark:bg-zinc-800/60 p-8 rounded-[48px] border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                    {THEMES.map((t) => (
                                        <button 
                                            key={t.id} 
                                            onClick={() => setCustomTheme(t)} 
                                            className={clsx(
                                                "w-12 h-12 rounded-full border-4 transition-all hover:scale-125 active:scale-90 bg-gradient-to-br",
                                                t.gradient,
                                                customTheme.id === t.id ? "border-pink-500 ring-[12px] ring-pink-500/10 scale-125 shadow-2xl" : "border-white/15 opacity-80"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Studio Preview Card */}
                                <div className="relative shadow-[0_80px_160px_-40px_rgba(0,0,0,0.6)] rounded-[64px] overflow-hidden transition-all duration-700 group/asset" style={{ height: '540px', width: '304px' }}>
                                    <div className={clsx("w-full h-full flex flex-col items-center justify-center relative p-10 text-center transition-all duration-1000 bg-gradient-to-br", customTheme.gradient)}>
                                        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                                        
                                        <div className="absolute top-12 flex items-center gap-3 opacity-90">
                                            <div className="w-10 h-10 rounded-[14px] bg-white/20 backdrop-blur-3xl flex items-center justify-center text-white border border-white/20 shadow-xl"><Shield size={22} /></div>
                                            <span className="text-white font-black uppercase tracking-[0.5em] text-[10px]">Whisper Studio</span>
                                        </div>
                                        
                                        {downloadItem.type === 'profile' ? (
                                            <div className="relative z-10 flex flex-col items-center w-full">
                                                <div className="w-32 h-32 rounded-full border-[10px] border-white/25 mb-10 overflow-hidden shadow-2xl ring-16 ring-black/5">
                                                    <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 p-10 rounded-[44px] shadow-2xl rotate-3 w-full">
                                                    <h2 className={clsx("font-black text-3xl leading-tight drop-shadow-2xl", customTheme.text)}>Drop a secret message!</h2>
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-3xl px-8 py-4 rounded-full border border-white/10 mt-14 shadow-2xl">
                                                     <p className="text-white font-black text-sm tracking-tight uppercase">
                                                        askme.app/u/{profile.username}
                                                     </p>
                                                </div>
                                            </div>
                                        ) : downloadItem.type === 'question' && downloadItem.answer ? (
                                            <div className="relative z-10 w-full">
                                                <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 p-12 rounded-[48px] shadow-2xl rotate-3">
                                                    <h2 className={clsx("font-black text-3xl leading-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</h2>
                                                </div>
                                                <div className="mt-16">
                                                    <div className="bg-black/40 backdrop-blur-3xl px-10 py-5 rounded-full border border-white/10 inline-block shadow-2xl">
                                                        <p className="text-white font-black text-sm tracking-widest uppercase">askme.app/u/{profile.username}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : downloadItem.answer && (
                                            <div className="relative z-10 w-full py-8">
                                                <div className="bg-white/10 border border-white/20 p-10 rounded-[48px] mb-10 shadow-2xl text-left backdrop-blur-3xl rotate-2">
                                                    <p className={clsx("font-black text-3xl leading-tight tracking-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</p>
                                                </div>
                                                <div className="flex gap-5 items-start px-3 text-left bg-black/40 p-8 rounded-[44px] backdrop-blur-[60px] border border-white/15 shadow-2xl">
                                                    <img src={profile.avatar} className="w-16 h-16 rounded-full border-[5px] border-white/25 shadow-2xl" alt="Avatar" />
                                                    <div className="flex-1">
                                                        <p className={clsx("font-black text-[10px] uppercase tracking-[0.4em] mb-2 opacity-60", customTheme.text)}>{profile.fullName}</p>
                                                        <p className={clsx("text-2xl leading-tight font-black", customTheme.text)}>{downloadItem.answer.answerText}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-6 border-t border-zinc-100 dark:border-zinc-800">
                                <button 
                                    onClick={handleDownload} 
                                    disabled={downloading}
                                    className="w-full bg-mesh-pink text-white font-black py-8 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(236,72,153,0.6)] flex items-center justify-center gap-6 active:scale-[0.98] transition-all hover:opacity-95 text-3xl"
                                >
                                    {downloading ? <Loader2 className="animate-spin" size={40} /> : <Download size={40} />}
                                    {downloading ? 'Studio Exporting...' : 'Export Studio Asset'}
                                </button>
                                <p className="text-center text-[12px] font-black uppercase tracking-[0.6em] text-zinc-400">Ultra-High Res Export • HDR Studio Finish</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicProfile;
