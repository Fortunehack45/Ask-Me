
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Eye, EyeOff, LogOut, RefreshCcw, Info, User, ShieldCheck, Palette, Bell, Globe, ChevronRight, Copy
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

      if (editUsername.toLowerCase() !== userProfile.username.toLowerCase()) {
        const lastChange = userProfile.lastUsernameChange || 0;
        const now = Date.now();
        const daysPassed = (now - lastChange) / (1000 * 60 * 60 * 24);

        if (daysPassed < 7) {
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
      setProfileMessage({ type: 'success', text: 'Identity updated successfully!' });
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
      setPassMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setPassMessage({ type: 'error', text: 'Re-authentication failed. Check current password.' });
    } finally {
      setPassLoading(false);
    }
  };

  const usernameCooldown = (() => {
    if (!userProfile?.lastUsernameChange) return 0;
    const daysPassed = (Date.now() - userProfile.lastUsernameChange) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysPassed));
  })();

  return (
    <div className="w-full max-w-4xl mx-auto pb-40">
      {/* Header Section */}
      <div className="mb-12 px-2">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg mt-2">Personalize your anonymous presence.</p>
      </div>

      <div className="space-y-8">
        {/* PROFILE SECTION */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-sm transition-all">
          <div className="p-8 md:p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Public Identity</h2>
                <p className="text-sm font-medium text-zinc-500">Manage how you appear to others.</p>
              </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-8 md:p-12 space-y-10">
              {/* Avatar Studio */}
              <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white dark:border-zinc-800 shadow-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                          <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <button 
                        type="button" 
                        onClick={generateNewAvatar}
                        className="absolute bottom-1 right-1 w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-zinc-900 z-10"
                      >
                          <RefreshCcw size={20} strokeWidth={3} />
                      </button>
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white">Studio Avatar</h3>
                      <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-sm">
                        Generate a professional anonymous identity. These characters help keep your presence unique yet mysterious.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputGroup label="Display Name" value={editFullName} onChange={setEditFullName} placeholder="e.g. Secret Soul" icon={User} />
                  
                  <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest">Username</label>
                        {usernameCooldown > 0 && <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full">Locked</span>}
                      </div>
                      <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-black">@</span>
                          <input 
                            type="text"
                            value={editUsername}
                            onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                            disabled={usernameCooldown > 0}
                            className={clsx(
                              "w-full bg-zinc-50 dark:bg-zinc-950/50 border rounded-3xl pl-10 pr-6 py-4.5 text-zinc-900 dark:text-white outline-none font-bold transition-all",
                              usernameCooldown > 0 
                                ? "border-zinc-100 dark:border-zinc-800 opacity-50 cursor-not-allowed" 
                                : "border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500"
                            )}
                          />
                      </div>
                      {usernameCooldown > 0 && (
                        <p className="text-[10px] font-bold text-orange-500 flex items-center gap-1.5 px-1">
                          <Info size={12} /> Editable in {usernameCooldown} days
                        </p>
                      )}
                  </div>
              </div>

              <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black uppercase text-zinc-400 tracking-widest">Your Story (Bio)</label>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{editBio.length}/160</span>
                  </div>
                  <textarea 
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    maxLength={160}
                    rows={4}
                    placeholder="Whisper something about yourself..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[32px] px-6 py-6 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-medium leading-relaxed resize-none"
                  />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                  <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      {profileMessage.text && (
                        <motion.p 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0, x: 10 }} 
                          className={clsx("text-sm font-black uppercase tracking-widest", profileMessage.type === 'success' ? "text-green-500" : "text-red-500")}
                        >
                          {profileMessage.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <button 
                    type="submit" 
                    disabled={profileLoading}
                    className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black font-black px-12 py-5 rounded-2xl shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                    Save Identity
                  </button>
              </div>
          </form>
        </section>

        {/* PREFERENCES SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 flex flex-col justify-between group">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Appearance</h2>
                      <p className="text-xs font-medium text-zinc-500">Theme preferences</p>
                    </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-950/50 p-1.5 rounded-2xl flex border border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            theme === 'light' ? "bg-white text-zinc-900 shadow-md" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        <Sun size={14} /> Light
                    </button>
                    <button 
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            theme === 'dark' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Moon size={14} /> Dark
                    </button>
                </div>
            </section>

            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 flex flex-col justify-between group">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Profile Link</h2>
                      <p className="text-xs font-medium text-zinc-500">Quick sharing</p>
                    </div>
                </div>

                <button 
                  onClick={handleCopyLink}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between transition-all group/btn"
                >
                    <span className="text-xs font-bold text-zinc-500 truncate mr-2">askme.app/u/{userProfile?.username}</span>
                    <div className="shrink-0 bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-sm group-hover/btn:text-pink-500">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </div>
                </button>
            </section>
        </div>

        {/* SECURITY MODULE */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden">
            <div className="p-8 md:p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                        <ShieldCheck size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Security Center</h2>
                        <p className="text-sm font-medium text-zinc-500">Protect your account.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-8 md:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">Current Password</label>
                        <div className="relative group">
                            <input 
                              type={showCurrent ? "text" : "password"}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4.5 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-bold placeholder:opacity-30"
                              required
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">New Password</label>
                        <div className="relative group">
                            <input 
                              type={showNew ? "text" : "password"}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4.5 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-bold placeholder:opacity-30"
                              required
                              minLength={6}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <AnimatePresence mode="wait">
                        {passMessage.text && (
                          <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className={clsx("text-xs font-black uppercase tracking-widest", passMessage.type === 'success' ? "text-green-500" : "text-red-500")}>
                            {passMessage.text}
                          </motion.p>
                        )}
                    </AnimatePresence>
                    <button 
                      type="submit"
                      disabled={passLoading || !currentPassword || !newPassword}
                      className="w-full md:w-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-black px-10 py-4.5 rounded-2xl shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {passLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                      Update Security
                    </button>
                </div>
            </form>
        </section>

        {/* DANGER ZONE / ACCOUNT */}
        <section className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">Danger Zone</h2>
                <p className="text-red-600/60 dark:text-red-400/60 font-medium text-sm">Log out or close your current session.</p>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full md:w-auto bg-red-600 text-white font-black px-10 py-5 rounded-[24px] shadow-2xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 group/logout"
            >
                <LogOut size={22} className="group-hover/logout:-translate-x-1 transition-transform" />
                Sign Out Forever
            </button>
        </section>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-3">
    <label className="text-xs font-black uppercase text-zinc-400 tracking-widest px-1">{label}</label>
    <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-pink-500 transition-colors">
          <Icon size={20} />
        </div>
        <input 
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl pl-14 pr-6 py-4.5 text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-bold placeholder:opacity-30"
        />
    </div>
  </div>
);

export default Settings;
