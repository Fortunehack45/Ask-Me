import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Eye, EyeOff, LogOut, RefreshCcw, Info, User, ShieldCheck, Palette, Bell, Globe, ChevronRight, Copy, Trash2, Camera, Sparkles, Settings as SettingsIcon
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
    <div className="w-full max-w-4xl mx-auto pb-40 px-4">
      {/* Page Heading */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="text-pink-500" size={28} />
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">Account</h1>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">Manage your identity and app preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* PROFILE SECTION CARD */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] shadow-sm overflow-hidden group">
          <div className="p-8 md:p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Public Profile</h2>
                <p className="text-sm font-medium text-zinc-500">How others see you on the platform.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-8 md:p-12 space-y-12">
            {/* Avatar Studio */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-[6px] border-white dark:border-zinc-800 shadow-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
                >
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </motion.div>
                <button 
                  type="button" 
                  onClick={generateNewAvatar}
                  className="absolute bottom-1 right-1 w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-zinc-900 z-10"
                >
                  <RefreshCcw size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    Studio Character <Sparkles className="text-pink-500" size={18} />
                  </h3>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-sm mt-1">
                    Your character is your unique visual signature. Refresh to find the perfect mysterious persona.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-widest">Premium Collection</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup 
                label="Full Name" 
                value={editFullName} 
                onChange={setEditFullName} 
                placeholder="The Mastermind" 
                icon={User} 
              />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase text-zinc-400 tracking-widest">Username</label>
                  {usernameCooldown > 0 && (
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Locked</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-black">@</span>
                  <input 
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    disabled={usernameCooldown > 0}
                    className={clsx(
                      "w-full bg-zinc-50 dark:bg-zinc-950/50 border rounded-3xl pl-10 pr-6 py-4 text-zinc-900 dark:text-white outline-none font-bold transition-all",
                      usernameCooldown > 0 
                        ? "border-zinc-100 dark:border-zinc-800 opacity-50 cursor-not-allowed" 
                        : "border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500"
                    )}
                  />
                </div>
                {usernameCooldown > 0 && (
                  <p className="text-[10px] font-bold text-orange-500 flex items-center gap-1.5 px-1 mt-2">
                    <Info size={12} /> Editable in {usernameCooldown} days
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase text-zinc-400 tracking-widest">About You</label>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{editBio.length}/160</span>
              </div>
              <textarea 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={160}
                rows={4}
                placeholder="Write a mysterious bio..."
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[32px] px-6 py-5 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-medium leading-relaxed resize-none shadow-inner"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                  {profileMessage.text && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                        profileMessage.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {profileMessage.type === 'success' ? <Check size={14} strokeWidth={3} /> : <Info size={14} />}
                      {profileMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="submit" 
                disabled={profileLoading}
                className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-pink-500/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                Update Profile
              </button>
            </div>
          </form>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* THEME SELECTOR */}
          <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-10 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Appearance</h2>
                  <p className="text-sm font-medium text-zinc-500">Pick your visual vibe.</p>
                </div>
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-950/50 p-1.5 rounded-[24px] flex border border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    theme === 'light' ? "bg-white text-zinc-900 shadow-md scale-[1.02]" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Sun size={16} /> Day Mode
                </button>
                <button 
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    theme === 'dark' ? "bg-zinc-900 text-white shadow-md scale-[1.02]" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Moon size={16} /> Night Mode
                </button>
              </div>
            </div>
          </section>

          {/* QUICK LINKS */}
          <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-10 flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Profile Link</h2>
                  <p className="text-sm font-medium text-zinc-500">Quick link to share.</p>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={handleCopyLink}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-5 rounded-[24px] flex items-center justify-between transition-all group/btn"
                >
                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 truncate mr-4 tracking-tight">{profileUrl}</span>
                  <div className={clsx(
                    "shrink-0 p-3 rounded-xl shadow-sm transition-all",
                    copied ? "bg-green-500 text-white" : "bg-white dark:bg-zinc-900 text-zinc-400 group-hover/btn:text-pink-500"
                  )}>
                    {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                  </div>
                </button>
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-1 text-[10px] font-black text-green-500 uppercase tracking-widest"
                  >
                    Successfully Copied!
                  </motion.p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* SECURITY SECTION CARD */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Security</h2>
              <p className="text-sm font-medium text-zinc-500">Keep your account safe and updated.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 py-4 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:opacity-20 shadow-inner"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 py-4 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:opacity-20 shadow-inner"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <AnimatePresence mode="wait">
                {passMessage.text && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className={clsx("flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest", passMessage.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                    {passMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
              <button 
                type="submit"
                disabled={passLoading || !currentPassword || !newPassword}
                className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black font-black px-12 py-5 rounded-2xl shadow-xl hover:bg-black dark:hover:bg-zinc-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {passLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                Update Security
              </button>
            </div>
          </form>
        </section>

        {/* DANGER ZONE SECTION */}
        <section className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Trash2 size={120} className="text-red-500" />
          </div>
          <div className="text-center md:text-left relative z-10">
            <h2 className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight mb-2">Danger Zone</h2>
            <p className="text-red-600/70 dark:text-red-400/60 font-medium text-lg max-w-sm">Close your current session or manage account termination.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-12 py-5 rounded-[24px] shadow-2xl shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-4 text-xl group/logout"
          >
            <LogOut size={24} className="group-hover/logout:-translate-x-1 transition-transform" />
            Sign Out Now
          </button>
        </section>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-3">
    <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">{label}</label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
        <Icon size={20} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-bold placeholder:opacity-20 shadow-inner"
      />
    </div>
  </div>
);

export default Settings;