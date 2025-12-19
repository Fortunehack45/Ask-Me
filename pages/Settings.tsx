
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
// Fixed: Added missing MessageCircle icon import to resolve "Cannot find name 'MessageCircle'" error
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Eye, EyeOff, LogOut, RefreshCcw, Info, User, ShieldCheck, Palette, Bell, Globe, ChevronRight, Copy, Trash2, Camera, Sparkles, Settings as SettingsIcon, Code2, Heart, MessageCircle
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
    <div className="w-full max-w-[1200px] mx-auto pb-40 px-4 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <SettingsIcon className="text-pink-500" size={40} />
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter">Settings</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl leading-relaxed">Manage your studio identity and platform preferences.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {/* PUBLIC PROFILE GLASS CARD */}
        <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 rounded-[64px] shadow-sm overflow-hidden group">
          <div className="p-12 md:p-14 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[28px] bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <User size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Public Profile</h2>
                <p className="text-lg font-medium text-zinc-500 mt-1">Control your visual presence.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-12 md:p-16 space-y-16">
            {/* High-End Avatar Editor */}
            <div className="flex flex-col xl:flex-row items-center gap-14">
              <div className="relative group/avatar">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border-[10px] border-white dark:border-zinc-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                >
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={generateNewAvatar}>
                    <Camera className="text-white" size={48} />
                  </div>
                </motion.div>
                <button 
                  type="button" 
                  onClick={generateNewAvatar}
                  className="absolute bottom-2 right-2 w-16 h-16 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-[6px] border-white dark:border-zinc-900 z-10"
                >
                  <RefreshCcw size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="flex-1 space-y-6 text-center xl:text-left">
                <div>
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center justify-center xl:justify-start gap-3">
                    Studio Avatar <Sparkles className="text-pink-500" size={24} />
                  </h3>
                  <p className="text-zinc-500 font-bold text-xl leading-relaxed max-w-lg mt-2">
                    Refresh to regenerate your unique studio character. Your visual persona helps others recognize you.
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 bg-zinc-100 dark:bg-white/5 px-6 py-3 rounded-full border border-zinc-200 dark:border-white/10">
                  <span className="text-[12px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-[0.3em]">Premium Collection</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <InputGroup 
                label="Display Name" 
                value={editFullName} 
                onChange={setEditFullName} 
                placeholder="The Studio Master" 
                icon={User} 
              />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.3em]">Username</label>
                  {usernameCooldown > 0 && (
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Cooldown</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-xl">@</span>
                  <input 
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    disabled={usernameCooldown > 0}
                    className={clsx(
                      "w-full bg-zinc-50 dark:bg-white/5 border rounded-[32px] pl-12 pr-8 py-6 text-zinc-900 dark:text-white outline-none font-bold text-xl transition-all",
                      usernameCooldown > 0 
                        ? "border-zinc-100 dark:border-white/5 opacity-50 cursor-not-allowed" 
                        : "border-zinc-200 dark:border-white/10 focus:ring-[10px] focus:ring-pink-500/5 focus:border-pink-500"
                    )}
                  />
                </div>
                {usernameCooldown > 0 && (
                  <p className="text-[11px] font-bold text-orange-500 flex items-center gap-2 px-2 mt-3 opacity-80">
                    <Info size={14} /> Available in {usernameCooldown} days
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.3em]">Bio</label>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{editBio.length}/160</span>
              </div>
              <textarea 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={160}
                rows={4}
                placeholder="Share a mysterious hint about yourself..."
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[48px] px-8 py-8 text-zinc-900 dark:text-white outline-none focus:ring-[10px] focus:ring-pink-500/5 focus:border-pink-500 font-bold text-xl leading-relaxed resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  {profileMessage.text && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className={clsx(
                        "flex items-center gap-3 px-6 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em]",
                        profileMessage.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {profileMessage.type === 'success' ? <Check size={18} strokeWidth={3} /> : <Info size={18} />}
                      {profileMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="submit" 
                disabled={profileLoading}
                className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-black px-16 py-7 rounded-[32px] shadow-2xl shadow-pink-500/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-2xl"
              >
                {profileLoading ? <Loader2 className="animate-spin" size={28} /> : <Check size={28} strokeWidth={3} />}
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* SECURITY & APPERANCE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* THEME SELECTOR */}
          <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-14 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-[28px] bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {theme === 'dark' ? <Moon size={32} /> : <Sun size={32} />}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Vibe</h2>
                  <p className="text-lg font-medium text-zinc-500 mt-1">Platform aesthetic.</p>
                </div>
              </div>

              <div className="bg-zinc-100 dark:bg-white/5 p-2 rounded-[32px] flex border border-zinc-200 dark:border-white/10">
                <button 
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-3 py-6 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all",
                    theme === 'light' ? "bg-white text-zinc-900 shadow-xl scale-[1.02]" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Sun size={20} /> Light
                </button>
                <button 
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-3 py-6 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all",
                    theme === 'dark' ? "bg-zinc-950 text-white shadow-xl scale-[1.02]" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Moon size={20} /> Dark
                </button>
              </div>
            </div>
          </section>

          {/* SHARE CARD */}
          <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-14 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-[28px] bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe size={32} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Studio Link</h2>
                  <p className="text-lg font-medium text-zinc-500 mt-1">Your portal URL.</p>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={handleCopyLink}
                  className="w-full bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 p-7 rounded-[32px] flex items-center justify-between transition-all group/btn"
                >
                  <span className="text-base font-bold text-zinc-500 dark:text-zinc-400 truncate mr-6 tracking-tight">{profileUrl}</span>
                  <div className={clsx(
                    "shrink-0 p-4 rounded-2xl shadow-xl transition-all",
                    copied ? "bg-green-500 text-white" : "bg-white dark:bg-zinc-900 text-zinc-400 group-hover/btn:text-pink-500"
                  )}>
                    {copied ? <Check size={22} strokeWidth={3} /> : <Copy size={22} />}
                  </div>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* SECURITY SECTION */}
        <section className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 rounded-[64px] shadow-sm overflow-hidden">
          <div className="p-12 md:p-14 border-b border-zinc-100 dark:border-white/5 flex items-center gap-6">
            <div className="w-16 h-16 rounded-[28px] bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Security</h2>
              <p className="text-lg font-medium text-zinc-500 mt-1">Protect your portal.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-12 md:p-16 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.3em] px-2">Current Key</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white outline-none focus:ring-[10px] focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-xl placeholder:opacity-20 shadow-inner"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    {showCurrent ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.3em] px-2">New Key</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white outline-none focus:ring-[10px] focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-xl placeholder:opacity-20 shadow-inner"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    {showNew ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-zinc-100 dark:border-white/5">
              <AnimatePresence mode="wait">
                {passMessage.text && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className={clsx("flex items-center gap-3 px-6 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em]", passMessage.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                    {passMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
              <button 
                type="submit"
                disabled={passLoading || !currentPassword || !newPassword}
                className="w-full md:w-auto bg-zinc-950 dark:bg-white text-white dark:text-black font-black px-16 py-7 rounded-[32px] shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 text-2xl"
              >
                {passLoading ? <Loader2 className="animate-spin" size={28} /> : <Lock size={28} />}
                Lock Security
              </button>
            </div>
          </form>
        </section>

        {/* LOGOUT AREA */}
        <section className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[64px] p-12 md:p-16 flex flex-col xl:flex-row items-center justify-between gap-12 shadow-sm relative overflow-hidden group/danger">
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none group-hover/danger:scale-110 transition-transform duration-1000">
            <Trash2 size={240} className="text-red-500" />
          </div>
          <div className="text-center xl:text-left relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 dark:text-red-400 tracking-tighter mb-4 leading-none">Session Manager</h2>
            <p className="text-red-600/70 dark:text-red-400/60 font-bold text-xl max-w-lg leading-relaxed">End your current session or manage account termination.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-20 py-8 rounded-[40px] shadow-[0_32px_64px_rgba(220,38,38,0.3)] transition-all active:scale-95 flex items-center justify-center gap-6 text-3xl group/logout"
          >
            <LogOut size={32} className="group-hover/logout:-translate-x-2 transition-transform" />
            Sign Out
          </button>
        </section>
        
        {/* BILLION-DOLLAR STUDIO CREDITS */}
        <section className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-950/40 backdrop-blur-[40px] border border-zinc-200 dark:border-white/5 rounded-[64px] shadow-sm overflow-hidden relative group/credits">
          <div className="absolute inset-0 bg-noise opacity-[0.02]"></div>
          <div className="p-12 md:p-14 border-b border-zinc-100 dark:border-white/5 flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-[28px] bg-pink-500 text-white flex items-center justify-center shadow-xl shadow-pink-500/20">
              <Code2 size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Studio Credits</h2>
              <p className="text-lg font-medium text-zinc-500 mt-1">The architect behind the platform.</p>
            </div>
          </div>
          
          <div className="p-12 md:p-16 flex flex-col md:flex-row items-center gap-12 relative z-10">
             <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-orange-500 blur-2xl opacity-20 group-hover/credits:opacity-40 transition-opacity"></div>
                <div className="w-32 h-32 rounded-[40px] bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-2xl flex items-center justify-center text-5xl font-black text-pink-500 relative">
                  E
                </div>
             </div>
             
             <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <h3 className="text-3xl font-black bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tighter">
                    Esho Fortune Adebayo
                  </h3>
                  <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-2">
                    <ShieldCheck size={14} /> Verified Architect
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg max-w-xl leading-relaxed">
                  Crafting high-fidelity digital experiences with a focus on speed, security, and world-class aesthetics. Built with passion to empower anonymous expression.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                  <a href="https://wa.me/2349167689200" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                    <MessageCircle size={18} /> Contact Architect
                  </a>
                  <div className="flex items-center gap-3 px-6 py-3 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-200 dark:border-white/10">
                    <Heart size={18} className="text-pink-500 fill-pink-500" /> Handcrafted in Nigeria
                  </div>
                </div>
             </div>
          </div>
          
          <div className="bg-zinc-100/50 dark:bg-black/20 p-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-zinc-100 dark:border-white/5 relative z-10">
             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Platform Version 1.0.4 - Studio Pro Edition</p>
             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">© 2024 Ask Me Studio. All Rights Reserved.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-4">
    <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.3em] px-2">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400">
        <Icon size={24} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] pl-16 pr-8 py-6 text-zinc-900 dark:text-white outline-none focus:ring-[10px] focus:ring-pink-500/5 focus:border-pink-500 transition-all font-bold text-xl placeholder:opacity-20 shadow-inner"
      />
    </div>
  </div>
);

export default Settings;
