
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
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <img src={profile.avatar} alt={profile.username} className="relative w-36 h-36 rounded-full object-cover border-[8px] border-white dark:border-zinc-950 shadow-2xl transition-transform group-hover:scale-105 duration-500" />
                {profile.premiumStatus && (
                    <div className="absolute -right-1 bottom-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white p-2 rounded-full border-4 border-white dark:border-zinc-950 shadow-xl">
                        <Sparkles size={18} fill="white" />
                    </div>
                )}
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{profile.fullName}</h1>
                <p className="text-pink-600 dark:text-pink-400 font-black text-base mb-6 tracking-wide bg-pink-500/10 dark:bg-pink-500/20 px-4 py-1.5 rounded-full inline-block border border-pink-500/20">@{profile.username}</p>
                {profile.bio && <p className="text-zinc-600 dark:text-zinc-300 text-lg font-medium max-w-sm leading-relaxed mb-8 mx-auto">{profile.bio}</p>}
                <button onClick={handleShare} className="group flex items-center gap-3 text-sm font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-8 py-3.5 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95">
                    {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="group-hover:text-pink-500 transition-colors" />}
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
                            <div className={clsx("absolute -inset-1 rounded-[40px] opacity-75 blur-xl transition duration-1000 bg-gradient-to-r", theme.gradient)}></div>
                            <div className="relative bg-zinc-950 rounded-[38px] p-2 shadow-2xl">
                                <div className={clsx("rounded-[32px] p-8 sm:p-12 relative overflow-hidden min-h-[280px] flex flex-col transition-all duration-700 bg-gradient-to-br", theme.gradient)}>
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
                                            <Shield size={14} className="text-white" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Anonymous</span>
                                        </div>
                                        <button onClick={randomize} className="text-white/80 hover:text-white transition-all p-2.5 hover:bg-white/10 rounded-full active:rotate-180 duration-700">
                                            <Dice5 size={24} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    <textarea 
                                      ref={textareaRef} 
                                      value={text} 
                                      onChange={(e) => setText(e.target.value)} 
                                      placeholder="Send me a secret message..." 
                                      className="w-full bg-transparent text-white placeholder-white/40 text-2xl sm:text-3xl font-black border-none focus:ring-0 resize-none flex-1 leading-tight selection:bg-white/20 p-0" 
                                      maxLength={300} 
                                    />
                                    <div className="flex justify-between items-end mt-10 relative z-10">
                                        <div className="flex gap-2.5 p-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                                            {THEMES.slice(0, 6).map(t => (
                                                <button key={t.id} onClick={() => setTheme(t)} className={clsx("w-6 h-6 rounded-full border-2 transition-all hover:scale-125", t.css, theme.id === t.id ? "border-white scale-125 shadow-lg" : "border-transparent opacity-60")} />
                                            ))}
                                        </div>
                                        <span className={clsx("text-xs font-black font-mono tracking-widest uppercase", text.length > 280 ? "text-red-300" : "text-white/40")}>{text.length}/300</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-full mt-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-xl py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                            {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} strokeWidth={3} />}
                            {sending ? 'Sending Secretly...' : 'Send Message'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-center py-16 px-8 bg-white dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl backdrop-blur-xl">
                        <div className="w-24 h-24 bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl text-white relative">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}><Check size={48} strokeWidth={4} /></motion.div>
                        </div>
                        <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Message Sent!</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-10 text-lg max-w-xs mx-auto leading-relaxed">Your anonymous message is safely on its way to @{profile.username}.</p>
                        <button onClick={() => setSent(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black px-10 py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-lg">Send Another Secret</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-20 space-y-10">
                <div className="flex items-center gap-6 mb-8 px-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Recent Answers</h3>
                    <div className="h-0.5 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent flex-1"></div>
                </div>
                
                {answers.length === 0 ? (
                    <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px]">
                        <p className="text-zinc-400 font-black uppercase tracking-widest">No public answers yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {answers.map(ans => (
                            <motion.div key={ans.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[36px] p-10 shadow-xl transition-all backdrop-blur-md overflow-hidden relative group">
                                {!ans.isPublic ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
                                            <Lock size={28} />
                                        </div>
                                        <p className="text-zinc-400 font-black text-sm tracking-[0.2em] uppercase">Private Answer</p>
                                        <p className="text-zinc-500 font-medium mt-2">Only @{profile.username} can see this.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-8 relative z-10">
                                            <span className="text-xs font-black text-pink-500 uppercase tracking-[0.2em] mb-3 block">Secret Message</span>
                                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight">{ans.questionText}</h3>
                                        </div>
                                        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/80">
                                            <p className="text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed text-xl mb-8">{ans.answerText}</p>
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-400">
                                                <span>{timeAgo(ans.timestamp)}</span>
                                                <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-800">
                                                  <Heart size={16} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : ""} /> 
                                                  <span className="dark:text-white">{ans.likes} Likes</span>
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

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 flex flex-col items-center text-center p-12 bg-gradient-to-br from-zinc-900 to-black rounded-[48px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
                <p className="text-white font-black text-2xl tracking-tight mb-2 relative z-10">Ready to receive your own?</p>
                <p className="text-zinc-400 font-medium mb-10 text-lg max-w-xs relative z-10">Join @{profile.username} and thousands of others on Ask Me.</p>
                <Link to={user ? "/" : "/auth"} className="group relative inline-flex items-center gap-4 bg-white text-black font-black text-xl px-12 py-5 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95"><Sparkles size={24} className="text-pink-500" />Create My Profile</Link>
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
            await new Promise(r => setTimeout(r, 200));
            const dataUrl = await toPng(captureRef.current, { 
              cacheBust: true, 
              pixelRatio: 4, 
              backgroundColor: 'transparent' 
            });
            const link = document.createElement('a');
            link.download = `AskMe-${downloadItem?.type}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            setDownloadItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(false);
        }
    };

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
        <div className="w-full space-y-10">
            {/* High-End Sharing Dashboard */}
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] group-hover:bg-pink-500/20 transition-all duration-1000"></div>
                <div className="flex-1 text-center md:text-left relative z-10">
                    <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Expand your reach</h3>
                    <p className="text-zinc-400 font-bold text-lg leading-relaxed">Download a high-resolution profile asset to share on your IG or Snap story.</p>
                </div>
                <button 
                    onClick={() => setDownloadItem({ type: 'profile' })} 
                    className="shrink-0 bg-white hover:bg-zinc-100 text-black font-black px-12 py-5 rounded-[24px] shadow-2xl transition-all flex items-center gap-4 active:scale-95 group/btn"
                >
                    <ImageDown size={24} className="group-hover/btn:scale-110 transition-transform" />
                    Share Profile
                </button>
            </div>

            <div className="flex items-center gap-6 py-6">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Your Answer Feed</h3>
                <div className="h-0.5 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent flex-1"></div>
            </div>

            {answers.length === 0 ? (
                <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[48px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 w-full">
                    <p className="text-zinc-500 font-black uppercase tracking-widest text-lg mb-3">No answers yet</p>
                    <p className="text-zinc-400 font-bold">Go to your inbox to reply to some messages!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {answers.map((ans, i) => (
                        <motion.div key={ans.id} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-10 shadow-xl transition-all backdrop-blur-md group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="mb-8 relative flex justify-between items-start">
                                <div className="pl-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] block">Secret Message</span>
                                        <button 
                                            onClick={() => handleTogglePrivacy(ans)}
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                                ans.isPublic 
                                                    ? "bg-pink-500/10 text-pink-500 border-pink-500/20" 
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                            )}
                                        >
                                            {ans.isPublic ? <Eye size={12} /> : <Lock size={12} />}
                                            {ans.isPublic ? 'Visible' : 'Hidden'}
                                        </button>
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight">{ans.questionText}</h3>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteAnswer(e, ans.id)}
                                    className="p-3 rounded-2xl hover:bg-red-500/10 text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="pl-2">
                                <p className="text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed text-xl mb-10">{ans.answerText}</p>
                                <div className="flex flex-wrap items-center gap-4 pt-10 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'question' })} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"><ImageIcon size={18} /><span>Question Asset</span></button>
                                    <button onClick={() => setDownloadItem({ answer: ans, type: 'full' })} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"><Download size={18} /><span>Full Story Post</span></button>
                                    <div className="ml-auto flex items-center gap-5 text-xs font-black uppercase tracking-widest text-zinc-400">
                                        <span>{timeAgo(ans.timestamp)}</span>
                                        <span className="flex items-center gap-2"><Heart size={18} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : ""} /> {ans.likes}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Billion-Dollar Download & Customizer Modal */}
            <AnimatePresence>
                {downloadItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-3xl" onClick={() => setDownloadItem(null)} />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
                            className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[48px] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.4)]"
                        >
                            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center"><Palette size={22} /></div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Asset Studio</h3>
                                </div>
                                <button onClick={() => setDownloadItem(null)} className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full transition-all active:scale-90"><X size={24} /></button>
                            </div>

                            <div className="p-10 flex flex-col items-center max-h-[70vh] overflow-y-auto no-scrollbar">
                                {/* Visual Theme Palette */}
                                <div className="flex gap-3 mb-10 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                    {THEMES.map((t) => (
                                        <button 
                                            key={t.id} 
                                            onClick={() => setCustomTheme(t)} 
                                            className={clsx(
                                                "w-8 h-8 rounded-full border-2 transition-all hover:scale-125 active:scale-90 bg-gradient-to-br",
                                                t.gradient,
                                                customTheme.id === t.id ? "border-pink-500 ring-4 ring-pink-500/10 scale-125 shadow-2xl" : "border-white/10 opacity-70"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Premium Story Preview */}
                                <div className="relative shadow-[0_40px_100px_rgba(0,0,0,0.3)] rounded-[36px] overflow-hidden transition-all duration-700" style={{ height: downloadItem.type === 'full' ? 'auto' : '520px', width: downloadItem.type === 'full' ? '100%' : '290px' }}>
                                    <div 
                                        ref={captureRef} 
                                        className={clsx(
                                            "w-full h-full flex flex-col items-center justify-center relative p-10 text-center transition-all duration-1000 bg-gradient-to-br",
                                            customTheme.gradient
                                        )}
                                        style={{ minHeight: downloadItem.type === 'full' ? 'auto' : '520px' }}
                                    >
                                        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                                        
                                        <div className="absolute top-8 flex items-center gap-2 opacity-90">
                                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl"><Shield size={16} /></div>
                                            <span className="text-white font-black uppercase tracking-[0.3em] text-[8px]">Ask Me Anonymously</span>
                                        </div>
                                        
                                        {downloadItem.type === 'profile' ? (
                                            <div className="relative z-10 flex flex-col items-center w-full">
                                                <div className="w-24 h-24 rounded-full border-[6px] border-white/20 mb-8 overflow-hidden shadow-2xl ring-8 ring-black/5 transition-transform duration-700">
                                                    <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-3xl border border-white/30 p-8 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] rotate-1 w-full">
                                                    <h2 className={clsx("font-black text-2xl leading-tight drop-shadow-2xl", customTheme.text)}>Send me secret messages!</h2>
                                                </div>
                                                <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 mt-10 shadow-2xl">
                                                     <p className="text-white font-black text-xs tracking-tight">
                                                        askme.app<span className="text-white/40">/u/{profile.username}</span>
                                                     </p>
                                                </div>
                                            </div>
                                        ) : downloadItem.type === 'question' && downloadItem.answer ? (
                                            <div className="relative z-10 w-full">
                                                <div className="bg-white/10 backdrop-blur-3xl border border-white/30 p-8 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] rotate-1">
                                                    <h2 className={clsx("font-black text-2xl leading-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</h2>
                                                </div>
                                                <div className="mt-12">
                                                    <p className="text-white/40 text-[9px] uppercase font-black tracking-[0.3em] mb-3">Post a reply at</p>
                                                    <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 inline-block shadow-2xl">
                                                        <p className="text-white font-black text-xs">askme.app/u/{profile.username}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : downloadItem.answer && (
                                            <div className="relative z-10 w-full py-6">
                                                <div className="bg-white/10 border border-white/20 p-8 rounded-[32px] mb-6 shadow-2xl text-left backdrop-blur-3xl rotate-1">
                                                    <p className={clsx("font-black text-2xl leading-tight tracking-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</p>
                                                </div>
                                                <div className="flex gap-5 items-start px-2 text-left bg-black/20 p-6 rounded-[32px] backdrop-blur-xl border border-white/10 shadow-2xl">
                                                    <img src={profile.avatar} className="w-14 h-14 rounded-full border-[3px] border-white/20 shadow-2xl" alt="Avatar" />
                                                    <div className="flex-1">
                                                        <p className={clsx("font-black text-sm uppercase tracking-widest mb-1", customTheme.text)}>{profile.fullName}</p>
                                                        <p className={clsx("text-lg leading-relaxed font-bold opacity-90", customTheme.text)}>{downloadItem.answer.answerText}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-4">
                                <button 
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all hover:opacity-90 text-lg"
                                >
                                    {downloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                                    Download Studio Asset
                                </button>
                                <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Premium 4K Rendering • High Dynamic Range</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicProfile;
