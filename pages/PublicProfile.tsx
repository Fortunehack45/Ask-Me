import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserByUsername, sendQuestion, getUserFeed, deleteAnswer, updateAnswerVisibility } from '../services/db';
import { UserProfile, Answer } from '../types';
import { 
  Send, Dice5, Shield, Loader2, Share2, Check, Download, 
  Heart, Sparkles, ImageDown, Trash2, 
  Lock, Eye, Palette, X, ChevronRight, Activity, Camera
} from '../components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { copyToClipboard, timeAgo } from '../utils';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

const THEMES = [
  { id: 'ocean', name: 'Ocean', css: 'bg-blue-600', gradient: 'from-blue-600 via-blue-700 to-indigo-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'noir', name: 'Noir', css: 'bg-zinc-950', gradient: 'from-zinc-900 via-zinc-950 to-black', text: 'text-white', card: 'bg-white/5 backdrop-blur-2xl border-white/10' },
  { id: 'crimson', name: 'Crimson', css: 'bg-rose-600', gradient: 'from-rose-500 via-pink-600 to-rose-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'aurora', name: 'Aurora', css: 'bg-emerald-600', gradient: 'from-emerald-400 via-teal-500 to-emerald-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'sunset', name: 'Sunset', css: 'bg-orange-500', gradient: 'from-orange-400 via-pink-500 to-rose-600', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'nebula', name: 'Nebula', css: 'bg-purple-600', gradient: 'from-violet-400 via-purple-600 to-indigo-900', text: 'text-white', card: 'bg-white/10 backdrop-blur-2xl border-white/20' },
  { id: 'midnight', name: 'Midnight', css: 'bg-slate-900', gradient: 'from-slate-800 via-slate-950 to-black', text: 'text-white', card: 'bg-white/5 border-white/10' },
  { id: 'lemonade', name: 'Lemonade', css: 'bg-yellow-400', gradient: 'from-yellow-300 via-orange-400 to-amber-600', text: 'text-zinc-900', card: 'bg-black/5 backdrop-blur-2xl border-black/10' },
];

const placeholders = [
  "What's your honest opinion on me?",
  "What's a secret nobody knows?",
  "Who is your secret crush?",
  "Last thing you lied about?",
  "What would you change about your life?",
];

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareStudio, setShowShareStudio] = useState(false);
  const [shareTheme, setShareTheme] = useState(THEMES[0]);
  const [isSharing, setIsSharing] = useState(false);
  const shareCaptureRef = useRef<HTMLDivElement>(null);

  const isOwner = user && profile && user.uid === profile.uid;

  useEffect(() => {
    const loadData = async () => {
      if (!username || username === 'undefined') { setLoading(false); return; }
      const data = await getUserByUsername(username);
      setProfile(data);
      setLoading(false); 
      if (data) document.title = `@${data.username} | Ask Me`;
    };
    loadData();
    return () => { document.title = 'Ask Me'; };
  }, [username]);

  const handleNativeShare = async () => {
    if (!profile || !shareCaptureRef.current) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(shareCaptureRef.current, { pixelRatio: 3, cacheBust: true, width: 1080, height: 1920 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `askme-${profile.username}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Ask @${profile.username} Anything!`, text: `Send me an anonymous message here:`, url: window.location.href, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: `Ask @${profile.username}`, url: window.location.href });
      } else {
        await copyToClipboard(window.location.href);
        alert("Link copied!");
      }
      setShowShareStudio(false);
    } catch (err) { console.error("Share failed", err); } finally { setIsSharing(false); }
  };

  if (!username || username === 'undefined') return <Navigate to="/" />;

  if (loading) return (
      <div className="flex flex-col items-center pt-32 animate-pulse w-full">
        <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-8"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-4"></div>
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 text-zinc-400"><Shield size={32} /></div>
      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">Identity Not Found</h2>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center pb-24 relative">
      <div className="w-full flex flex-col items-center pt-8 md:pt-12">
        <ProfileHeader profile={profile} onShareRequest={() => setShowShareStudio(true)} />
        <div className="w-full mt-10">
            {isOwner ? <OwnerView profile={profile} /> : <VisitorView profile={profile} />}
        </div>
      </div>

      <AnimatePresence>
        {showShareStudio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setShowShareStudio(false)} />
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 15 }} className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-lg"><Palette size={18} /></div>
                        <h3 className="text-lg font-black dark:text-white tracking-tight">Share Profile</h3>
                    </div>
                    <button onClick={() => setShowShareStudio(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><X size={20} /></button>
                </div>
                <div className="p-8 flex flex-col items-center gap-8 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="relative shadow-2xl rounded-[32px] overflow-hidden" style={{ height: '320px', width: '180px' }}>
                        <div className={clsx("w-full h-full flex flex-col items-center justify-center p-6 text-center relative bg-gradient-to-br transition-all duration-700", shareTheme.gradient)}>
                             <div className="w-16 h-16 rounded-full border-[6px] border-white/30 mb-6 shadow-xl overflow-hidden">
                                <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className={clsx("p-6 rounded-[24px] border shadow-xl w-full text-[12px] font-black leading-tight", shareTheme.card, shareTheme.text)}>Send me anonymous messages!</div>
                        </div>
                    </div>
                    <div className="w-full flex flex-wrap justify-center gap-3">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setShareTheme(t)} className={clsx("w-8 h-8 rounded-full border-2 transition-all hover:scale-110", t.css, shareTheme.id === t.id ? "border-pink-500 ring-4 ring-pink-500/10 shadow-lg" : "border-white/10 opacity-70")} />
                        ))}
                    </div>
                </div>
                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button onClick={handleNativeShare} disabled={isSharing} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-5 rounded-[24px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 text-lg">
                        {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />} {isSharing ? 'Generating...' : 'Share Profile'}
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfileHeader = ({ profile, onShareRequest }: { profile: UserProfile, onShareRequest: () => void }) => (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-4xl">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6 group">
            <div className="absolute inset-0 rounded-full bg-pink-500 blur-2xl opacity-10 group-hover:opacity-25 transition-opacity duration-700"></div>
            <img src={profile.avatar} alt={profile.username} className="relative w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-[4px] border-white dark:border-zinc-900 shadow-xl" />
            {profile.premiumStatus && <div className="absolute -right-1 bottom-1 bg-pink-500 text-white p-1.5 rounded-lg border-2 border-white dark:border-zinc-950 shadow-lg"><Sparkles size={12} fill="white" /></div>}
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{profile.fullName}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm tracking-tight">@{profile.username}</p>
            {profile.bio && <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium max-w-md mx-auto leading-relaxed">{profile.bio}</p>}
            <div className="pt-3">
                <button onClick={onShareRequest} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-[10px] font-black text-zinc-900 dark:text-white hover:bg-zinc-200 transition-all active:scale-95 shadow-sm uppercase tracking-widest"><Palette size={14} className="text-pink-500" /> Studio Asset</button>
            </div>
        </motion.div>
    </div>
);

const VisitorView = ({ profile }: { profile: UserProfile }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [text, setText] = useState('');
    const [theme, setTheme] = useState(THEMES[0]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        getUserFeed(profile.uid).then(setAnswers);
    }, [profile.uid]);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try { await sendQuestion(profile.uid, text, theme.id); setSent(true); } 
        catch (e) { alert("Failed to send."); } finally { setSending(false); }
    };

    return (
        <div className="w-full flex flex-col items-center px-6">
            <AnimatePresence mode='wait'>
                {!sent ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                        <div className="relative bg-zinc-950 rounded-[40px] p-1 shadow-2xl">
                            <div className={clsx("rounded-[36px] p-10 min-h-[280px] flex flex-col bg-gradient-to-br transition-all duration-700", theme.gradient)}>
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-1.5 border border-white/10">
                                        <Shield size={12} className="text-white" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Whisper Mode</span>
                                    </div>
                                    <button onClick={() => setText(placeholders[Math.floor(Math.random() * placeholders.length)])} className="text-white/70 hover:text-white transition-all"><Dice5 size={20} /></button>
                                </div>
                                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything anonymously..." className="w-full bg-transparent text-white placeholder-white/30 text-2xl font-black border-none focus:ring-0 resize-none flex-1 leading-tight p-0" maxLength={300} />
                                <div className="flex justify-between items-end mt-6 relative z-10">
                                    <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-xl rounded-full border border-white/5">
                                        {THEMES.map(t => (
                                            <button key={t.id} onClick={() => setTheme(t)} className={clsx("w-5 h-5 rounded-full border-2 transition-all", t.css, theme.id === t.id ? "border-white" : "border-transparent opacity-60")} />
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{text.length}/300</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-full mt-6 bg-zinc-950 dark:bg-white text-white dark:text-black font-black text-lg py-5 rounded-[24px] shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} {sending ? 'Sending...' : 'Send Whisper'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center py-16 px-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg"><Check size={32} strokeWidth={4} /></div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">Whisper Sent!</h2>
                        <button onClick={() => setSent(false)} className="mt-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest">Send Another</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-4xl mt-20">
                <div className="flex items-center gap-6 mb-10"><h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight shrink-0">Studio Feed</h3><div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1"></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {answers.map(ans => (
                        <div key={ans.id} className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-lg relative overflow-hidden">
                            {!ans.isPublic ? <div className="py-10 text-center opacity-30"><Lock size={24} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Private</p></div> : (
                                <>
                                    <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-3 block">Anonymous Whisper</span>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">{ans.questionText}</h3>
                                    <div className="pt-6 border-t border-zinc-100 dark:border-white/5"><p className="text-zinc-600 dark:text-zinc-300 font-bold italic text-lg leading-relaxed">"{ans.answerText}"</p></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const OwnerView = ({ profile }: { profile: UserProfile }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserFeed(profile.uid).then(d => { setAnswers(d); setLoading(false); });
    }, [profile.uid]);

    if (loading) return <div className="py-20 flex justify-center w-full"><Loader2 className="animate-spin text-pink-500" size={32} /></div>;

    return (
        <div className="w-full flex flex-col items-center px-6">
            <div className="w-full max-w-4xl bg-zinc-950 dark:bg-white rounded-[40px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black text-white dark:text-black tracking-tight leading-none mb-2">Studio Activity</h3>
                    <p className="text-zinc-400 dark:text-zinc-500 font-bold text-sm">Manage your whispers and public presence.</p>
                </div>
                <Link to="/inbox" className="px-10 py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">Check Inbox</Link>
            </div>
            
            <div className="w-full max-w-4xl mt-16 space-y-6">
                {answers.length === 0 ? <div className="py-20 text-center text-zinc-400 font-bold">No whispers found.</div> : answers.map(ans => (
                    <div key={ans.id} className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4"><span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Question</span><div className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", ans.isPublic ? "bg-pink-500/10 text-pink-500 border-pink-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>{ans.isPublic ? 'Public' : 'Hidden'}</div></div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-6 leading-tight">{ans.questionText}</h3>
                        <div className="pt-6 border-t border-zinc-100 dark:border-white/5"><p className="text-zinc-600 dark:text-zinc-300 font-bold italic text-lg opacity-80 leading-relaxed">"{ans.answerText}"</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PublicProfile;