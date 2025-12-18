
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed, deleteAnswer, updateAnswerVisibility } from '../services/db';
import { UserProfile, Answer } from '../types';
import { Send, Dice5, Shield, Loader2, Share2, Check, Download, Image as ImageIcon, Heart, Sparkles, ImageDown, Trash2, Lock, Eye } from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="w-full max-w-4xl flex flex-col gap-10 pt-16 md:pt-20 relative z-10">
        <ProfileHeader profile={profile} />
        <div className="transition-all duration-500 ease-out">
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
                title: `Ask @${profile.username}`,
                text: `Send me an anonymous message!`,
                url: url
            });
            return;
          } catch (e) { /* ignore fallback to copy */ }
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
                className="relative mb-6 group cursor-default"
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <img src={profile.avatar} alt={profile.username} className="relative w-32 h-32 rounded-full object-cover border-[6px] border-white dark:border-zinc-950 shadow-2xl" />
                {profile.premiumStatus && (
                    <div className="absolute -right-1 bottom-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-1.5 rounded-full border-4 border-white dark:border-zinc-950 shadow-sm">
                        <Sparkles size={14} fill="white" />
                    </div>
                )}
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">{profile.fullName}</h1>
                <p className="text-zinc-500 font-bold text-sm mb-5 tracking-wide bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1 rounded-full inline-block border border-zinc-200 dark:border-zinc-800">@{profile.username}</p>
                {profile.bio && <p className="text-zinc-600 dark:text-zinc-300 text-base font-medium max-w-sm leading-relaxed mb-6 mx-auto">{profile.bio}</p>}
                <button onClick={handleShare} className="group flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-full transition-all backdrop-blur-sm mx-auto active:scale-95">
                    {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} className="group-hover:text-pink-500 transition-colors" />}
                    {copied ? 'Link Copied' : 'Share Profile'}
                </button>
            </motion.div>
        </div>
    );
};

const VisitorView = ({ profile }: { profile: UserProfile }) => {
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
            alert("Failed to send.");
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
        <div className="w-full relative min-h-[500px]">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}>
                        <div className="relative group">
                            <div className={clsx("absolute -inset-0.5 rounded-[34px] opacity-75 blur transition duration-1000 bg-gradient-to-r", theme.gradient)}></div>
                            <div className="relative bg-zinc-900 dark:bg-black rounded-[32px] p-1.5 shadow-2xl">
                                <div className={clsx("rounded-[28px] p-6 sm:p-8 relative overflow-hidden min-h-[240px] flex flex-col", theme.css)}>
                                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/5">
                                            <Shield size={12} className="text-white/80" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Anonymous</span>
                                        </div>
                                        <button onClick={randomize} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full active:rotate-180 duration-500">
                                            <Dice5 size={20} />
                                        </button>
                                    </div>
                                    <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Send me an anonymous message..." className="w-full bg-transparent text-white placeholder-white/50 text-xl sm:text-2xl font-bold border-none focus:ring-0 resize-none flex-1 leading-relaxed selection:bg-white/30 p-0" maxLength={300} />
                                    <div className="flex justify-between items-end mt-6 relative z-10">
                                        <div className="flex gap-2">
                                            {THEMES.map(t => (
                                                <button key={t.id} onClick={() => setTheme(t)} className={clsx("w-6 h-6 rounded-full border-2", t.css, theme.id === t.id ? "border-white scale-110" : "border-transparent opacity-60")} />
                                            ))}
                                        </div>
                                        <span className={clsx("text-xs font-bold font-mono", text.length > 280 ? "text-red-300" : "text-white/40")}>{text.length}/300</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-full mt-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg py-4 rounded-[20px] shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                            <span className="relative z-10 flex items-center gap-2">
                                {sending ? <Loader2 className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
                                {sending ? 'Sending...' : 'Send Anonymously'}
                            </span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-center py-12 px-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[32px] shadow-sm backdrop-blur-sm">
                        <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-white relative">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}><Check size={40} strokeWidth={4} /></motion.div>
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Sent!</h2>
                        <p className="text-zinc-500 font-medium mb-8 max-w-xs mx-auto">Your message is safely on its way.</p>
                        <button onClick={() => setSent(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold px-8 py-3.5 rounded-full">Send Another</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-16 space-y-6">
                <div className="flex items-center gap-4 mb-4 px-2">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Answers</h3>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                </div>
                
                {answers.length === 0 ? (
                    <div className="py-20 text-center bg-zinc-50/50 dark:bg-zinc-900/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px]">
                        <p className="text-zinc-400 font-bold">No public answers yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {answers.map(ans => (
                            <motion.div key={ans.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-8 shadow-sm transition-all backdrop-blur-sm overflow-hidden relative group">
                                {!ans.isPublic ? (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-3">
                                            <Lock size={20} />
                                        </div>
                                        <p className="text-zinc-400 font-bold text-sm tracking-wide uppercase">Private Message</p>
                                        <p className="text-zinc-500 text-xs mt-1">This answer is hidden by the user.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-6">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Anonymous Asked</span>
                                            <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{ans.questionText}</h3>
                                        </div>
                                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                                            <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed text-lg">{ans.answerText}</p>
                                            <div className="mt-6 flex justify-between text-xs text-zinc-400">
                                                <span>{timeAgo(ans.timestamp)}</span>
                                                <div className="flex items-center gap-1"><Heart size={14} /> {ans.likes}</div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 flex flex-col items-center text-center">
                <p className="text-zinc-900 dark:text-white font-bold text-lg">👇 Want to receive secret messages?</p>
                <Link to={user ? "/" : "/auth"} className="group relative mt-4 inline-flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg px-8 py-4 rounded-full shadow-2xl transition-all"><Sparkles size={20} className="text-yellow-400" />Get your own link</Link>
            </motion.div>
        </div>
    );
};

const OwnerView = ({ profile }: { profile: UserProfile }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{answer?: Answer, type: 'question' | 'full' | 'profile'} | null>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchContent = async () => {
            const data = await getUserFeed(profile.uid);
            setAnswers(data);
            setLoading(false);
        };
        fetchContent();
    }, [profile.uid]);

    useEffect(() => {
        if (downloadItem && captureRef.current) {
            const capture = async () => {
                await new Promise(r => setTimeout(r, 100));
                try {
                    const dataUrl = await toPng(captureRef.current!, { cacheBust: true, pixelRatio: 3, backgroundColor: 'transparent' });
                    const link = document.createElement('a');
                    link.download = `askme-${downloadItem.type}-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                } finally {
                    setDownloadItem(null);
                }
            };
            capture();
        }
    }, [downloadItem]);

    const handleDeleteAnswer = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this answer from your feed?")) return;
        try {
            await deleteAnswer(id);
            setAnswers(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            alert("Failed to delete.");
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

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    return (
        <div className="w-full space-y-8">
            {/* Quick Promo Section */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm backdrop-blur-sm">
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Get more questions!</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Download your profile story and post it on Instagram or Snapchat.</p>
                </div>
                <button 
                    onClick={() => setDownloadItem({ type: 'profile' })} 
                    className="shrink-0 bg-pink-500 hover:bg-pink-600 text-white font-black px-8 py-4 rounded-[20px] shadow-lg shadow-pink-500/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <ImageDown size={20} />
                    Share to Story
                </button>
            </div>

            <div className="flex items-center gap-4 py-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Your Answer Feed</h3>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
            </div>

            {answers.length === 0 ? (
                <div className="py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 w-full">
                    <p className="text-zinc-500 font-bold mb-2">No answered questions yet</p>
                    <p className="text-zinc-400 text-sm">Once you answer an anonymous message, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {answers.map((ans, i) => (
                        <motion.div key={ans.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 shadow-sm transition-all backdrop-blur-sm group">
                            <div className="mb-6 relative flex justify-between items-start">
                                <div className="pl-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Anonymous Asked</span>
                                        <button 
                                            onClick={() => handleTogglePrivacy(ans)}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                                ans.isPublic 
                                                    ? "bg-pink-500/10 text-pink-500 border-pink-500/20" 
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                            )}
                                        >
                                            {ans.isPublic ? <Eye size={10} /> : <Lock size={10} />}
                                            {ans.isPublic ? 'Public' : 'Private'}
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{ans.questionText}</h3>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteAnswer(e, ans.id)}
                                    className="p-2 rounded-full hover:bg-red-500/10 text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="pl-4">
                                <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed text-lg mb-6">{ans.answerText}</p>
                                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'question' })} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-600 dark:text-zinc-300"><ImageIcon size={14} /><span>Story</span></button>
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'full' })} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-600 dark:text-zinc-300"><Download size={14} /><span>Post</span></button>
                                    <div className="ml-auto flex items-center gap-4 text-xs font-medium text-zinc-400">
                                        <span>{timeAgo(ans.timestamp)}</span>
                                        <span className="flex items-center gap-1"><Heart size={14} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : ""} /> {ans.likes}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                {downloadItem && (
                    <div ref={captureRef} className={clsx("w-[600px] p-12 flex flex-col items-center justify-center relative bg-zinc-950 text-white", downloadItem.type !== 'full' ? 'min-h-[1067px]' : 'min-h-[auto]')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0"></div>
                        <div className="absolute top-10 flex items-center gap-2 opacity-60 z-20">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center text-white font-black text-sm">A</div>
                            <span className="font-bold tracking-widest text-sm uppercase">Ask Me</span>
                        </div>
                        
                        {downloadItem.type === 'profile' ? (
                            <div className="relative z-10 flex flex-col items-center max-w-md w-full">
                                <div className="w-32 h-32 rounded-full border-[8px] border-white/10 mb-10 overflow-hidden shadow-2xl">
                                    <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                                </div>
                                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-12 rounded-[48px] shadow-2xl rotate-2 mb-10 text-center w-full">
                                    <h2 className="text-5xl font-black leading-tight">Send me anonymous messages!</h2>
                                </div>
                                <div className="bg-black/30 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 mt-6 shadow-xl">
                                     <p className="text-white font-black text-2xl tracking-wide">
                                        askme.app<span className="text-white/40">/u/{profile.username}</span>
                                     </p>
                                </div>
                            </div>
                        ) : downloadItem.type === 'question' && downloadItem.answer ? (
                            <div className="relative z-10 p-10 max-w-md">
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[40px] shadow-2xl rotate-2">
                                    <h2 className="text-4xl font-black leading-tight">{downloadItem.answer.questionText}</h2>
                                </div>
                            </div>
                        ) : downloadItem.answer && (
                            <div className="relative z-10 w-full pt-8">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-orange-500"></div>
                                    <p className="text-3xl font-bold leading-tight">{downloadItem.answer.questionText}</p>
                                </div>
                                <div className="flex gap-5 mt-8 px-2">
                                    <img src={profile.avatar} className="w-20 h-20 rounded-full border-4 border-zinc-800" alt="Avatar" />
                                    <div>
                                        <p className="font-bold text-xl mb-2 text-white">{profile.fullName}</p>
                                        <p className="text-2xl leading-relaxed text-zinc-300 font-medium">{downloadItem.answer.answerText}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-10 text-white/30 font-mono text-xs z-20 bg-white/5 px-4 py-1.5 rounded-full">askme.app/u/{profile.username}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;