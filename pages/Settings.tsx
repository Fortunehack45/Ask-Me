import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Eye, EyeOff, LogOut, RefreshCcw, Info, User, ShieldCheck, Palette, Bell, Globe, ChevronRight, Copy, Trash2, Camera, Sparkles, Settings as SettingsIcon, Code2, Heart, MessageCircle, GraduationCap, Zap
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserProfile, isUsernameTaken } from '../services/db';
import { copyToClipboard } from '../utils';
import clsx from 'clsx';

const Settings = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Profile Edit State
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditFullName(userProfile.fullName || '');
      setEditUsername(userProfile.username || '');
      setEditBio(userProfile.bio || '');
      setEditAvatar(userProfile.avatar || '');
    }
  }, [userProfile]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  const handleCopyLink = async () => {
    if (!userProfile) return;
    const url = `${window.location.origin}/#/u/${userProfile.username}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateNewAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setEditAvatar(`https://api.dicebear.com/7.x/notionists/svg?seed=${randomSeed}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const updates: any = {
        fullName: editFullName,
        bio: editBio,
        avatar: editAvatar
      };

      if (editUsername && editUsername.toLowerCase() !== userProfile.username.toLowerCase()) {
        const lastChangeVal = userProfile.lastUsernameChange;
        let lastChangeMs = 0;
        
        if (typeof lastChangeVal === 'number') {
          lastChangeMs = lastChangeVal;
        } else if (lastChangeVal && typeof (lastChangeVal as any).toMillis === 'function') {
          lastChangeMs = (lastChangeVal as any).toMillis();
        }

        const now = Date.now();
        const daysPassed = (now - lastChangeMs) / (1000 * 60 * 60 * 24);

        if (lastChangeMs > 0 && daysPassed < 7) {
          const remainingDays = Math.ceil(7 - daysPassed);
          throw new Error(`Username change locked for ${remainingDays} days.`);
        }

        const taken = await isUsernameTaken(editUsername);
        if (taken) throw new Error("Username already taken.");

        updates.username = editUsername.toLowerCase();
        updates.lastUsernameChange = Date.now();
      }

      await updateUserProfile(user.uid, updates);
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Identity updated!' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setPassLoading(true);
    setPassMessage({ type: '', text: '' });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPassMessage({ type: 'success', text: 'Password updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setPassMessage({ type: 'error', text: 'Current password incorrect.' });
    } finally {
      setPassLoading(false);
    }
  };

  const usernameCooldown = useMemo(() => {
    if (!userProfile?.lastUsernameChange) return 0;
    const lastChangeVal = userProfile.lastUsernameChange;
    let lastChangeMs = 0;
    
    if (typeof lastChangeVal === 'number') {
      lastChangeMs = lastChangeVal;
    } else if (lastChangeVal && typeof (lastChangeVal as any).toMillis === 'function') {
      lastChangeMs = (lastChangeVal as any).toMillis();
    }
    
    if (lastChangeMs === 0) return 0;
    
    const daysPassed = (Date.now() - lastChangeMs) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysPassed));
  }, [userProfile?.lastUsernameChange]);

  const profileUrl = userProfile ? `askme.app/u/${userProfile.username}` : '';

  return (
    <div className="w-full pb-40 space-y-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-6 mb-4">
            <SettingsIcon className="text-pink-500" size={56} />
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">Settings</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-2xl leading-relaxed">Identity controls and global preferences.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-16">
        {/* PUBLIC PROFILE GLASS CARD */}
        <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] shadow-sm overflow-hidden group">
          <div className="p-14 md:p-16 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[32px] bg-pink-500/10 text-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/5">
                <User size={40} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Public Profile</h2>
                <p className="text-xl font-medium text-zinc-500 mt-2">Personalize your visitor experience.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-14 md:p-20 space-y-20">
            {/* High-End Avatar Editor */}
            <div className="flex flex-col xl:flex-row items-center gap-16">
              <div className="relative group/avatar shrink-0">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative w-56 h-56 md:w-72 md:h-72 rounded-full border-[12px] border-white dark:border-zinc-800 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                >
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={generateNewAvatar}>
                    <Camera className="text-white" size={64} />
                  </div>
                </motion.div>
                <button 
                  type="button" 
                  onClick={generateNewAvatar}
                  className="absolute bottom-4 right-4 w-20 h-20 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-[28px] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-[8px] border-white dark:border-zinc-900 z-10"
                >
                  <RefreshCcw size={32} strokeWidth={3} />
                </button>
              </div>
              <div className="flex-1 space-y-8 text-center xl:text-left">
                <div>
                  <h3 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center justify-center xl:justify-start gap-4 tracking-tight">
                    Studio Avatar <Sparkles className="text-pink-500" size={32} />
                  </h3>
                  <p className="text-zinc-500 font-bold text-2xl leading-relaxed max-w-xl mt-4">
                    Regenerate your unique character. Your visual persona defines your studio brand.
                  </p>
                </div>
                <div className="inline-flex items-center gap-4 bg-zinc-100 dark:bg-white/5 px-8 py-4 rounded-full border border-zinc-200 dark:border-white/10 shadow-sm">
                  <span className="text-[14px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-[0.4em]">Premium Artist Collection</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <InputGroup 
                label="Display Name" 
                value={editFullName} 
                onChange={setEditFullName} 
                placeholder="The Studio Master" 
                icon={User} 
              />
              
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.4em]">Unique Username</label>
                  {usernameCooldown > 0 && (
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">Locked</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-2xl">@</span>
                  <input 
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    disabled={usernameCooldown > 0}
                    className={clsx(
                      "w-full bg-zinc-50 dark:bg-white/5 border rounded-[40px] pl-16 pr-10 py-8 text-zinc-900 dark:text-white outline-none font-bold text-2xl transition-all shadow-inner",
                      usernameCooldown > 0 
                        ? "border-zinc-100 dark:border-white/5 opacity-50 cursor-not-allowed" 
                        : "border-zinc-200 dark:border-white/10 focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500"
                    )}
                  />
                </div>
                {usernameCooldown > 0 && (
                  <p className="text-sm font-bold text-orange-500 flex items-center gap-3 px-4 mt-4 opacity-80">
                    <Info size={16} /> Identity modification available in {usernameCooldown} days
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.4em]">Studio Bio</label>
                <span className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">{editBio.length}/160</span>
              </div>
              <textarea 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={160}
                rows={4}
                placeholder="Craft your mysterious introduction..."
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[56px] px-10 py-10 text-zinc-900 dark:text-white outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 font-bold text-2xl leading-relaxed resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-16 border-t border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-6">
                <AnimatePresence mode="wait">
                  {profileMessage.text && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }} 
                      className={clsx(
                        "flex items-center gap-4 px-8 py-4 rounded-full text-sm font-black uppercase tracking-[0.3em] shadow-xl",
                        profileMessage.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {profileMessage.type === 'success' ? <Check size={20} strokeWidth={4} /> : <Info size={20} />}
                      {profileMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="submit" 
                disabled={profileLoading}
                className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-black px-20 py-8 rounded-[40px] shadow-[0_40px_80px_-20px_rgba(236,72,153,0.4)] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-6 text-3xl"
              >
                {profileLoading ? <Loader2 className="animate-spin" size={36} /> : <Check size={36} strokeWidth={3} />}
                Update Identity
              </button>
            </div>
          </form>
        </section>

        {/* SECURITY SECTION */}
        <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] p-14 md:p-20 shadow-sm overflow-hidden group">
          <div className="flex items-center gap-8 mb-12">
            <div className="w-16 h-16 rounded-[24px] bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg">
              <Lock size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Security</h2>
              <p className="text-lg font-medium text-zinc-500 mt-2">Update your portal access keys.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.4em] px-4">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white outline-none focus:ring-8 focus:ring-pink-500/5 focus:border-pink-500 font-bold text-xl transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.4em] px-4">New Password</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white outline-none focus:ring-8 focus:ring-pink-500/5 focus:border-pink-500 font-bold text-xl transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
              <AnimatePresence mode="wait">
                {passMessage.text && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={clsx("text-sm font-bold uppercase tracking-widest", passMessage.type === 'success' ? "text-green-500" : "text-red-500")}>
                    {passMessage.text}
                  </motion.p>
                )}
              </AnimatePresence>
              <button 
                type="submit" 
                disabled={passLoading || !newPassword}
                className="w-full md:w-auto px-12 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {passLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Key'}
              </button>
            </div>
          </form>
        </section>

        {/* APPEARANCE & LINKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] p-16 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-8 mb-16">
                <div className="w-20 h-20 rounded-[32px] bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  {theme === 'dark' ? <Moon size={40} /> : <Sun size={40} />}
                </div>
                <div>
                  <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Vibe</h2>
                  <p className="text-xl font-medium text-zinc-500 mt-2">App aesthetic.</p>
                </div>
              </div>

              <div className="bg-zinc-100 dark:bg-white/5 p-3 rounded-[40px] flex border border-zinc-200 dark:border-white/10 shadow-inner">
                <button 
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-4 py-8 rounded-[32px] text-base font-black uppercase tracking-[0.4em] transition-all",
                    theme === 'light' ? "bg-white text-zinc-900 shadow-2xl scale-[1.03]" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Sun size={24} /> Light
                </button>
                <button 
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-4 py-8 rounded-[32px] text-base font-black uppercase tracking-[0.4em] transition-all",
                    theme === 'dark' ? "bg-zinc-950 text-white shadow-2xl scale-[1.03]" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Moon size={24} /> Dark
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] p-16 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-8 mb-16">
                <div className="w-20 h-20 rounded-[32px] bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Globe size={40} />
                </div>
                <div>
                  <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Studio Link</h2>
                  <p className="text-xl font-medium text-zinc-500 mt-2">Public portal URL.</p>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={handleCopyLink}
                  className="w-full bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 p-10 rounded-[48px] flex items-center justify-between transition-all group/btn shadow-inner"
                >
                  <span className="text-lg font-bold text-zinc-500 dark:text-zinc-400 truncate mr-10 tracking-tight leading-none">{profileUrl}</span>
                  <div className={clsx(
                    "shrink-0 p-6 rounded-3xl shadow-2xl transition-all",
                    copied ? "bg-green-500 text-white" : "bg-white dark:bg-zinc-900 text-zinc-400 group-hover/btn:text-pink-500"
                  )}>
                    {copied ? <Check size={28} strokeWidth={4} /> : <Copy size={28} />}
                  </div>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ABOUT DEVELOPER - PRESTIGE SECTION */}
        <section className="bg-zinc-950 rounded-[72px] p-16 md:p-20 text-white relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
            <div className="w-40 h-40 bg-white/10 rounded-[48px] flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-xl shrink-0 group-hover:scale-110 transition-transform duration-700">
              <Code2 size={80} strokeWidth={1.5} className="text-pink-500" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-pink-500/20 text-pink-500 rounded-full border border-pink-500/20 text-[10px] font-black uppercase tracking-[0.4em]">The Architect</div>
                <h2 className="text-6xl md:text-7xl font-black tracking-tighter leading-none">Esho Fortune <span className="text-pink-500">Adebayo</span></h2>
                <div className="flex flex-col gap-2">
                   <p className="text-2xl font-bold text-white leading-relaxed max-w-3xl">
                    Student of Information Systems (IFS/IS) in Federal University of Technology Akure, Ondo State.
                  </p>
                  <p className="text-xl font-medium text-white/50 leading-relaxed max-w-3xl">
                    A self-taught web and software architect crafting high-fidelity digital universes that bridge imagination and reality.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-10">
                <div className="flex items-center gap-4 text-white/50">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400"><GraduationCap size={20} /></div>
                  <span className="text-[12px] font-black uppercase tracking-widest">FUTA • IFS/IS</span>
                </div>
                <div className="flex items-center gap-4 text-white/50">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-pink-500"><Heart size={20} className="fill-current" /></div>
                  <span className="text-[12px] font-black uppercase tracking-widest">Digital Craftsman</span>
                </div>
              </div>

              <div className="pt-8">
                <a 
                  href="https://wa.me/2349167689200" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-5 bg-white text-black px-14 py-7 rounded-[32px] font-black text-2xl hover:bg-pink-500 hover:text-white transition-all shadow-[0_40px_80px_-20px_rgba(255,255,255,0.2)] active:scale-95"
                >
                  Connect with Creator <ChevronRight size={28} strokeWidth={3} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-6">
    <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.4em] px-4">{label}</label>
    <div className="relative">
      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400">
        <Icon size={32} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[40px] pl-20 pr-10 py-8 text-zinc-900 dark:text-white outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 transition-all font-bold text-2xl placeholder:opacity-20 shadow-inner"
      />
    </div>
  </div>
);

export default Settings;