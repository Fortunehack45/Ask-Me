
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed, deleteAnswer, updateAnswerVisibility } from '../services/db';
import { UserProfile, Answer } from '../types';
import { 
  Send, Dice5, Shield, Loader2, Share2, Check, Download, 
  Image as ImageIcon, Heart, Sparkles, ImageDown, Trash2, 
  Lock, Eye, Palette, X, ChevronRight, Activity
} from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

const THEMES = [
  { id: 'noir', name: 'Noir', css: 'bg-zinc-950', gradient: 'from-zinc-900 via-zinc-950 to-black', text: 'text-white' },
  { id: 'crimson', name: 'Crimson', css: 'bg-rose-600', gradient: 'from-rose-500 via-pink-600 to-rose-900', text: 'text-white' },
  { id: 'ocean', name: 'Ocean', css: 'bg-blue-600', gradient: 'from-blue-400 via-indigo-600 to-blue-900', text: 'text-white' },
  { id: 'aurora', name: 'Aurora', css: 'bg-emerald-600', gradient: 'from-emerald-400 via-teal-500 to-emerald-900', text: 'text-white' },
  { id: 'sunset', name: 'Sunset', css: 'bg-orange-500', gradient: 'from-orange-400 via-pink-500 to-rose-600', text: 'text-white' },
  { id: 'nebula', name: 'Nebula', css: 'bg-purple-600', gradient: 'from-violet-400 via-purple-600 to-indigo-900', text: 'text-white' },
  { id: 'lemonade', name: 'Lemonade', css: 'bg-yellow-400', gradient: 'from-yellow-300 via-orange-400 to-amber-600', text: 'text-zinc-900' },
  { id: 'midnight', name: 'Midnight', css: 'bg-slate-900', gradient: 'from-slate-800 via-slate-950 to-black', text: 'text-white' },
];

const placeholders = [
  "What is your honest opinion on me?",
  "What's a secret nobody knows?",
  "Who is your secret crush?",
  "What's the last thing you lied about?",
  "If you could change one thing about your life, what would it be?",
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
      <div className="flex flex-col items-center pt-32 animate-pulse w-full h-screen">
        <div className="w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-8"></div>
        <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4"></div>
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mb-6 text-zinc-400">
        <Shield size={40} />
      </div>
      <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">Identity Not Found</h2>
      <p className="text-zinc-500 font-medium">This user is currently unavailable.</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center pb-24 relative overflow-x-hidden">
      <div className="w-full flex flex-col items-center pt-10 md:pt-20">
        <ProfileHeader profile={profile} />
        <div className="w-full max-w-full transition-all duration-700 ease-out mt-12">
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
                text: `Send me an anonymous whisper!`,
                url: url
            });
            return;
          } catch (e) {}
        }
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center text-center px-6 w-full max-w-4xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-8 group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-orange-500 to-pink-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-spin-slow"></div>
                <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500">
                   <img src={profile.avatar} alt={profile.username} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[6px] border-white dark:border-zinc-950 shadow-2xl" />
                </div>
                {profile.premiumStatus && (
                    <div className="absolute -right-2 bottom-2 bg-mesh-pink text-white p-2.5 rounded-2xl border-4 border-white dark:border-zinc-950 shadow-xl">
                        <Sparkles size={18} fill="white" />
                    </div>
                )}
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{profile.fullName}</h1>
                <div className="flex items-center justify-center gap-3">
                    <p className="text-pink-600 dark:text-pink-400 font-black text-sm uppercase tracking-widest bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">@{profile.username}</p>
                </div>
                {profile.bio && <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl font-medium max-w-lg leading-relaxed">{profile.bio}</p>}
                <div className="pt-4 flex justify-center">
                    <button onClick={handleShare} className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-black text-zinc-900 dark:text-white shadow-xl hover:shadow-2xl transition-all active:scale-95">
                        {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="text-pink-500" />}
                        {copied ? 'Link Copied' : 'Share Profile'}
                    </button>
                </div>
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
        <div className="w-full flex flex-col items-center px-6">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -30 }} className="w-full max-w-2xl">
                        <div className="relative group">
                            <div className={clsx("absolute -inset-1.5 rounded-[42px] opacity-20 blur-xl transition duration-1000 bg-gradient-to-r", theme.gradient)}></div>
                            <div className="relative bg-zinc-950 rounded-[40px] p-1.5 shadow-2xl">
                                <div className={clsx("rounded-[36px] p-8 md:p-12 relative overflow-hidden min-h-[320px] flex flex-col bg-gradient-to-br transition-all duration-700", theme.gradient)}>
                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl rounded-full px-4 py-1.5 border border-white/10">
                                            <Shield size={14} className="text-white" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Whisper Mode</span>
                                        </div>
                                        <button onClick={randomize} className="text-white/70 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full active:rotate-180 duration-500">
                                            <Dice5 size={24} />
                                        </button>
                                    </div>
                                    <textarea 
                                      ref={textareaRef} 
                                      value={text} 
                                      onChange={(e) => setText(e.target.value)} 
                                      placeholder="Ask anything anonymously..." 
                                      className="w-full bg-transparent text-white placeholder-white/30 text-3xl md:text-4xl font-black border-none focus:ring-0 resize-none flex-1 leading-tight selection:bg-white/20 p-0" 
                                      maxLength={300} 
                                    />
                                    <div className="flex justify-between items-end mt-10 relative z-10">
                                        <div className="flex gap-2.5 p-2 bg-black/20 backdrop-blur-xl rounded-full border border-white/5">
                                            {THEMES.slice(0, 7).map(t => (
                                                <button key={t.id} onClick={() => setTheme(t)} className={clsx("w-6 h-6 rounded-full border-2 transition-all hover:scale-110", t.css, theme.id === t.id ? "border-white shadow-lg" : "border-transparent opacity-60")} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{text.length}/300</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-full mt-8 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-xl py-6 rounded-[28px] shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                            {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} strokeWidth={3} />}
                            {sending ? 'Sending...' : 'Send Whisper'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl text-center py-20 px-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[48px] shadow-2xl backdrop-blur-xl">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl text-white">
                            <Check size={48} strokeWidth={4} />
                        </div>
                        <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">Sent!</h2>
                        <p className="text-zinc-500 font-bold mb-10 text-lg">Your whisper is safe in their inbox.</p>
                        <button onClick={() => setSent(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black px-10 py-4 rounded-2xl hover:bg-zinc-200 transition-all text-sm">Send Another</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-5xl mt-24">
                <div className="flex items-center gap-6 mb-12">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Whisper Feed</h3>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                </div>
                
                {answers.length === 0 ? (
                    <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                        <p className="text-zinc-400 font-bold">No whispers found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {answers.map(ans => (
                            <motion.div key={ans.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden">
                                {!ans.isPublic ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <Lock size={32} className="text-zinc-400 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Private Content</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-8">
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-3 block">Anonymous Whisper</span>
                                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight">{ans.questionText}</h3>
                                        </div>
                                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                                            <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed text-lg mb-8">{ans.answerText}</p>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                <span>{timeAgo(ans.timestamp)}</span>
                                                <div className="flex items-center gap-1.5"><Heart size={14} /> {ans.likes}</div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mt-32 p-12 bg-zinc-900 dark:bg-white rounded-[48px] w-full max-w-4xl text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-mesh-pink opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <h3 className="text-3xl md:text-4xl font-black text-white dark:text-black mb-4 relative z-10 tracking-tighter">Want your own whispers?</h3>
                <p className="text-zinc-400 dark:text-zinc-500 font-bold mb-10 text-lg relative z-10">Start receiving anonymous questions from your fans today.</p>
                <Link to={user ? "/" : "/auth"} className="relative z-10 inline-flex items-center gap-3 bg-pink-500 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg">
                    <Sparkles size={20} />
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
            const dataUrl = await toPng(captureRef.current, { 
              cacheBust: true, pixelRatio: 4, backgroundColor: 'transparent', width: 1080, height: 1920
            });
            const link = document.createElement('a');
            link.download = `AskMe-Studio-${Date.now()}.png`;
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
            alert("Privacy update failed.");
        }
    };

    if (loading) return <div className="py-24 flex justify-center w-full"><Loader2 className="animate-spin text-pink-500" size={40} /></div>;

    return (
        <div className="w-full flex flex-col items-center px-6">
            {/* STUDIO RENDER ENGINE: Hidden container */}
            <div className="fixed left-[-9999px] top-0 overflow-hidden" style={{ width: '1080px', height: '1920px', pointerEvents: 'none' }}>
                <div ref={captureRef} className={clsx("w-full h-full flex flex-col items-center justify-center p-20 text-center relative bg-gradient-to-br", customTheme.gradient)}>
                     <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                     <div className="absolute top-24 flex flex-col items-center gap-8">
                        <div className="w-28 h-28 rounded-[40px] bg-white/20 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                          <Shield size={64} className="text-white" />
                        </div>
                        <span className="text-white font-black uppercase tracking-[0.6em] text-xl">Anonymous Studio Asset</span>
                     </div>
                     {downloadItem?.type === 'profile' && (
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-64 h-64 rounded-full border-[12px] border-white/20 mb-16 overflow-hidden shadow-2xl ring-24 ring-black/10">
                                <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            <div className="bg-white/10 backdrop-blur-[100px] border border-white/30 p-24 rounded-[100px] shadow-2xl rotate-3 w-full">
                                <h2 className={clsx("font-black text-7xl leading-tight drop-shadow-2xl", customTheme.text)}>Drop a secret whisper!</h2>
                            </div>
                        </div>
                     )}
                     {(downloadItem?.type === 'question' || downloadItem?.type === 'full') && downloadItem.answer && (
                        <div className="relative z-10 w-full">
                            <div className="bg-white/10 backdrop-blur-[100px] border border-white/30 p-24 rounded-[100px] shadow-2xl rotate-3 mb-16">
                                <h2 className={clsx("font-black text-7xl leading-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</h2>
                            </div>
                            {downloadItem.type === 'full' && (
                                <div className="flex gap-10 items-start px-12 text-left bg-black/40 p-16 rounded-[80px] backdrop-blur-[100px] border border-white/15 shadow-2xl w-full">
                                    <img src={profile.avatar} className="w-32 h-32 rounded-full border-[8px] border-white/20 shadow-2xl" alt="Avatar" />
                                    <div className="flex-1">
                                        <p className={clsx("font-black text-3xl uppercase tracking-[0.4em] mb-4 opacity-60", customTheme.text)}>{profile.fullName}</p>
                                        <p className={clsx("text-6xl leading-tight font-black", customTheme.text)}>{downloadItem.answer.answerText}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}
                     <div className="absolute bottom-24 flex flex-col items-center gap-10">
                         <div className="bg-black/50 backdrop-blur-3xl px-16 py-8 rounded-full border border-white/10 shadow-2xl">
                            <p className="text-white font-black text-4xl tracking-tighter">askme.app/u/{profile.username}</p>
                         </div>
                     </div>
                </div>
            </div>

            <div className="w-full max-w-5xl bg-zinc-900 dark:bg-white rounded-[48px] p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-mesh-pink opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="flex-1 text-center lg:text-left relative z-10">
                    <h3 className="text-4xl md:text-5xl font-black text-white dark:text-black mb-4 tracking-tighter leading-none">Studio Assets</h3>
                    <p className="text-zinc-400 dark:text-zinc-500 font-bold text-lg md:text-xl leading-relaxed">Download custom 4K assets designed for social stories.</p>
                </div>
                <button onClick={() => setDownloadItem({ type: 'profile' })} className="shrink-0 bg-white dark:bg-zinc-900 text-black dark:text-white font-black px-12 py-5 rounded-[24px] shadow-2xl transition-all flex items-center gap-4 active:scale-95 text-lg hover:-translate-y-1">
                    <ImageDown size={28} />
                    Export Studio Post
                </button>
            </div>

            <div className="w-full max-w-5xl mt-24">
                <div className="flex items-center gap-6 mb-12">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Manage Feed</h3>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                </div>
                
                {answers.length === 0 ? (
                    <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-zinc-100 dark:border-zinc-800 w-full flex flex-col items-center">
                        <p className="text-zinc-500 font-bold mb-4 opacity-50 text-xl">Empty Whisper Feed</p>
                        <Link to="/inbox" className="text-pink-500 font-black text-sm uppercase tracking-widest hover:underline">Start answering</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {answers.map((ans, i) => (
                            <motion.div key={ans.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 md:p-12 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="mb-10 relative flex flex-col lg:flex-row justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-4 mb-5">
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest block">Anonymous Whisper</span>
                                            <button 
                                                onClick={() => handleTogglePrivacy(ans)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    ans.isPublic 
                                                        ? "bg-pink-500/10 text-pink-500 border-pink-500/20" 
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                                )}
                                            >
                                                {ans.isPublic ? <Eye size={14} /> : <Lock size={14} />}
                                                {ans.isPublic ? 'Publicly Visible' : 'Hidden from feed'}
                                            </button>
                                        </div>
                                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight tracking-tighter">{ans.questionText}</h3>
                                    </div>
                                    <button onClick={(e) => handleDeleteAnswer(e, ans.id)} className="p-4 rounded-2xl hover:bg-red-500/10 text-zinc-300 hover:text-red-500 transition-all active:scale-90" title="Delete whisper">
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                                <div className="space-y-10">
                                    <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed text-xl mb-4">{ans.answerText}</p>
                                    <div className="flex flex-wrap items-center gap-5 pt-10 border-t border-zinc-100 dark:border-zinc-800/80">
                                        <button onClick={() => setDownloadItem({ answer: ans, type: 'question' })} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"><ImageIcon size={18} /><span>Question Asset</span></button>
                                        <button onClick={() => setDownloadItem({ answer: ans, type: 'full' })} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700 transition-all shadow-sm active:scale-95 hover:bg-zinc-50"><span>Full Story Post</span></button>
                                        <div className="lg:ml-auto flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            <span>{timeAgo(ans.timestamp)}</span>
                                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                                              <Heart size={16} className={ans.likes > 0 ? "text-pink-500 fill-pink-500" : "text-zinc-400"} /> 
                                              <span className="dark:text-white">{ans.likes} Likes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Modal logic remains efficient */}
            <AnimatePresence>
                {downloadItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl" onClick={() => setDownloadItem(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 50 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[48px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-mesh-pink text-white flex items-center justify-center shadow-xl"><Palette size={24} /></div>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Studio Creator</h3>
                                </div>
                                <button onClick={() => setDownloadItem(null)} className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"><X size={28} /></button>
                            </div>
                            <div className="p-10 flex flex-col items-center max-h-[60vh] overflow-y-auto no-scrollbar">
                                <div className="flex flex-wrap justify-center gap-4 mb-12 bg-zinc-100 dark:bg-zinc-800/60 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                    {THEMES.map((t) => (
                                        <button key={t.id} onClick={() => setCustomTheme(t)} className={clsx("w-10 h-10 rounded-full border-4 transition-all hover:scale-125 bg-gradient-to-br", t.gradient, customTheme.id === t.id ? "border-pink-500 ring-8 ring-pink-500/10 shadow-2xl" : "border-white/10 opacity-70")} />
                                    ))}
                                </div>
                                <div className="relative shadow-2xl rounded-[48px] overflow-hidden transition-all duration-700 group/asset" style={{ height: '480px', width: '270px' }}>
                                    <div className={clsx("w-full h-full flex flex-col items-center justify-center relative p-8 text-center bg-gradient-to-br", customTheme.gradient)}>
                                        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                                        <div className="absolute top-10 flex items-center gap-2 opacity-90">
                                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-3xl flex items-center justify-center text-white border border-white/20 shadow-xl"><Shield size={18} /></div>
                                            <span className="text-white font-black uppercase tracking-[0.5em] text-[8px]">Whisper Studio</span>
                                        </div>
                                        {downloadItem.type === 'profile' ? (
                                            <div className="relative z-10 flex flex-col items-center w-full">
                                                <div className="w-28 h-28 rounded-full border-[8px] border-white/25 mb-8 overflow-hidden shadow-2xl ring-12 ring-black/5">
                                                    <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 p-8 rounded-[36px] shadow-2xl rotate-3 w-full">
                                                    <h2 className={clsx("font-black text-2xl leading-tight drop-shadow-2xl", customTheme.text)}>Drop a secret whisper!</h2>
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 mt-12 shadow-2xl">
                                                     <p className="text-white font-black text-xs tracking-tighter uppercase">askme.app/u/{profile.username}</p>
                                                </div>
                                            </div>
                                        ) : downloadItem.answer && (
                                            <div className="relative z-10 w-full py-8">
                                                <div className="bg-white/10 border border-white/20 p-10 rounded-[40px] mb-8 shadow-2xl text-left backdrop-blur-3xl rotate-2">
                                                    <p className={clsx("font-black text-2xl leading-tight tracking-tight drop-shadow-2xl", customTheme.text)}>{downloadItem.answer.questionText}</p>
                                                </div>
                                                {downloadItem.type === 'full' && (
                                                    <div className="flex gap-4 items-start px-3 text-left bg-black/40 p-6 rounded-[32px] backdrop-blur-3xl border border-white/15 shadow-2xl">
                                                        <img src={profile.avatar} className="w-12 h-12 rounded-full border-[4px] border-white/25 shadow-2xl" alt="Avatar" />
                                                        <div className="flex-1">
                                                            <p className={clsx("font-black text-[8px] uppercase tracking-[0.4em] mb-1.5 opacity-60", customTheme.text)}>{profile.fullName}</p>
                                                            <p className={clsx("text-lg leading-tight font-black", customTheme.text)}>{downloadItem.answer.answerText}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-5 border-t border-zinc-100 dark:border-zinc-800">
                                <button onClick={handleDownload} disabled={downloading} className="w-full bg-mesh-pink text-white font-black py-6 rounded-[32px] shadow-xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all hover:opacity-95 text-2xl">
                                    {downloading ? <Loader2 className="animate-spin" size={32} /> : <Download size={32} />}
                                    {downloading ? 'Preparing Export...' : 'Export Studio Asset'}
                                </button>
                                <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Ultra-High Res Export • HDR Studio Finish</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicProfile;
