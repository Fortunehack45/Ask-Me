
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// Fix: Use 'import type' for interfaces like User and regular imports for classes and functions
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Code2, GraduationCap, Eye, EyeOff, MessageCircle, ExternalLink, LogOut, Camera, RefreshCcw, Info
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserProfile, isUsernameTaken } from '../services/db';
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

      // Handle Username Change Cooldown
      if (editUsername.toLowerCase() !== userProfile.username.toLowerCase()) {
        const lastChange = userProfile.lastUsernameChange || 0;
        const now = Date.now();
        const daysPassed = (now - lastChange) / (1000 * 60 * 60 * 24);

        if (daysPassed < 7) {
          const remainingDays = Math.ceil(7 - daysPassed);
          throw new Error(`Username locked for ${remainingDays} more day${remainingDays > 1 ? 's' : ''}.`);
        }

        const taken = await isUsernameTaken(editUsername);
        if (taken) {
          throw new Error("This username is already taken.");
        }

        updates.username = editUsername.toLowerCase();
        updates.lastUsernameChange = Date.now();
      }

      await updateUserProfile(user.uid, updates);
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Identity updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
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
      console.error("Password update failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setPassMessage({ type: 'error', text: 'Incorrect current password.' });
      } else if (err.code === 'auth/weak-password') {
         setPassMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      } else {
        setPassMessage({ type: 'error', text: 'Failed to update password.' });
      }
    } finally {
      setPassLoading(false);
    }
  };

  const daysUntilUsernameChange = () => {
    if (!userProfile?.lastUsernameChange) return 0;
    const daysPassed = (Date.now() - userProfile.lastUsernameChange) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysPassed));
  };

  const usernameCooldown = daysUntilUsernameChange();

  return (
    <div className="w-full pb-32 lg:pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg mt-2">Manage your anonymous brand and security.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
         <div className="space-y-8">
            {/* Profile Edit Card */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center transition-colors">
                      <div className="w-7 h-7 bg-pink-500 rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Profile Customizer</h3>
                      <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">How others see you in public feeds.</p>
                    </div>
                </div>

                {profileMessage.text && (
                    <div className={clsx(
                      "p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                      profileMessage.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}>
                        {profileMessage.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
                        {profileMessage.text}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="relative">
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-2xl bg-zinc-50 dark:bg-zinc-950 transition-all"
                            >
                                <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                            </motion.div>
                            <button 
                              type="button" 
                              onClick={generateNewAvatar}
                              className="absolute -bottom-1 -right-1 w-11 h-11 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-zinc-900 z-10"
                              title="Randomize Avatar"
                            >
                                <RefreshCcw size={22} />
                            </button>
                        </div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">Official DiceBear Avatars</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Full Name</label>
                            <input 
                              type="text"
                              value={editFullName}
                              onChange={e => setEditFullName(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3.5 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20 font-semibold"
                              placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Username</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">@</span>
                                <input 
                                  type="text"
                                  value={editUsername}
                                  onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                  className={clsx(
                                    "w-full bg-zinc-50 dark:bg-black/30 border rounded-2xl pl-10 pr-5 py-3.5 text-zinc-900 dark:text-white outline-none transition-all font-semibold",
                                    usernameCooldown > 0 
                                      ? "border-zinc-100 dark:border-zinc-800 opacity-50 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-800/20" 
                                      : "border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-pink-500/20"
                                  )}
                                  placeholder="username"
                                  disabled={usernameCooldown > 0}
                                />
                                {usernameCooldown > 0 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500">
                                      <Lock size={16} />
                                    </div>
                                )}
                            </div>
                            {usernameCooldown > 0 && (
                                <p className="text-[10px] font-bold text-orange-500/80 flex items-center gap-1.5 mt-1.5 ml-1 animate-pulse">
                                  <Info size={12} /> Locked: Next change in {usernameCooldown} day{usernameCooldown > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Profile Bio</label>
                          <span className={clsx("text-[10px] font-bold", editBio.length > 150 ? "text-red-500" : "text-zinc-400")}>
                            {editBio.length}/160
                          </span>
                        </div>
                        <textarea 
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          maxLength={160}
                          rows={3}
                          className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20 resize-none font-medium leading-relaxed"
                          placeholder="Tell the world something anonymous about you..."
                        />
                    </div>

                    <button 
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-4.5 rounded-[22px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 mt-4"
                    >
                      {profileLoading ? <Loader2 className="animate-spin" size={22} /> : <Check size={22} strokeWidth={3} />}
                      Update Public Profile
                    </button>
                </form>
            </section>

            {/* Appearance Card (Theme Toggle) */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
                            {theme === 'dark' ? <Moon size={28} /> : <Sun size={28} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Appearance</h3>
                            <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Switch between light and dark.</p>
                        </div>
                    </div>
                    
                    {/* Premium Segmented Control Theme Toggle */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-[20px] flex items-center relative overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-700 w-full sm:w-auto">
                        <button 
                            onClick={() => theme !== 'light' && toggleTheme()}
                            className={clsx(
                                "relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-2.5 rounded-[14px] text-sm font-black transition-all",
                                theme === 'light' ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <Sun size={18} strokeWidth={3} />
                            Light
                            {theme === 'light' && (
                                <motion.div 
                                    layoutId="theme-pill" 
                                    className="absolute inset-0 bg-white rounded-[14px] shadow-sm -z-10 border border-zinc-100"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                        <button 
                            onClick={() => theme !== 'dark' && toggleTheme()}
                            className={clsx(
                                "relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-2.5 rounded-[14px] text-sm font-black transition-all",
                                theme === 'dark' ? "text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <Moon size={18} strokeWidth={3} />
                            Dark
                            {theme === 'dark' && (
                                <motion.div 
                                    layoutId="theme-pill" 
                                    className="absolute inset-0 bg-zinc-900 rounded-[14px] shadow-sm -z-10 border border-zinc-700"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    </div>
                </div>
            </section>
         </div>

         <div className="space-y-8">
            {/* Security Card */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors">
                    <Lock size={28} />
                    </div>
                    <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Security</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Manage your login credentials.</p>
                    </div>
                </div>

                {passMessage.text && (
                    <div className={clsx(
                      "p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                      passMessage.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}>
                        {passMessage.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
                        {passMessage.text}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="relative group">
                        <input 
                          type={showCurrent ? "text" : "password"}
                          placeholder="Current Password"
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-600 font-medium"
                          required
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                        {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    <div className="relative group">
                        <input 
                          type={showNew ? "text" : "password"}
                          placeholder="New Password (min 6 chars)"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-600 font-medium"
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                        {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                          type="submit"
                          disabled={passLoading || !currentPassword || !newPassword}
                          className="bg-zinc-900 dark:bg-white text-white dark:text-black font-black px-8 py-4 rounded-[20px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                        >
                        {passLoading && <Loader2 className="animate-spin" size={18} />}
                        Update Security
                        </button>
                    </div>
                </form>
            </section>
            
            {/* Account Management Card */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors">
                    <LogOut size={28} />
                    </div>
                    <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Account Session</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Log out of your current device.</p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-black text-lg py-5 rounded-[24px] hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    Sign Out of Account
                </button>
            </section>
         </div>
      </div>
    </div>
  );
};

export default Settings;
