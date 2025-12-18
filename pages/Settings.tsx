
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// Consolidating imports to ensure proper modular SDK resolution from firebase/auth subpath
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, Check, Shield, Loader2, Code2, GraduationCap, Eye, EyeOff, MessageCircle, ExternalLink, LogOut 
} from '../components/Icons';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  /**
   * Securely handles password update with re-authentication
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Re-authenticate using modular credential generator
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update Password using modular update function
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error("Password update failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'The current password you entered is incorrect.' });
      } else if (err.code === 'auth/weak-password') {
         setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      } else if (err.code === 'auth/too-many-requests') {
         setMessage({ type: 'error', text: 'Too many attempts. Please try again later.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password. Please check your connection and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-32 lg:pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg mt-2">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
         <div className="space-y-8">
            {/* Theme Card */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
                        {theme === 'dark' ? <Moon size={28} /> : <Sun size={28} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Appearance</h3>
                        <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Switch between light and dark mode.</p>
                    </div>
                    </div>
                    
                    <button 
                      onClick={toggleTheme}
                      aria-label="Toggle Theme"
                      className="relative inline-flex h-9 w-16 items-center rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                    <span 
                        className={`${
                            theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                        } inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-spring`}
                    />
                    </button>
                </div>
            </section>

            {/* Security Card */}
            <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors">
                    <Lock size={28} />
                    </div>
                    <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Security</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Update your account credentials.</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {message.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
                        {message.text}
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
                          disabled={loading || !currentPassword || !newPassword}
                          className="bg-zinc-900 dark:bg-white text-white dark:text-black font-black px-8 py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                        >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Update Password
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
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Account</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Manage your active session.</p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-black text-lg py-5 rounded-[24px] hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    Log Out of Ask Me
                </button>
            </section>
         </div>

         <div className="space-y-8">
            {/* Professional Developer Card */}
            <section className="h-full bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-lg transition-all duration-300 relative group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="p-10 relative z-10">
                    <div className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-200 dark:border-pink-800/50">
                                    Developer
                                </span>
                            </div>
                            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
                                Esho Fortune Adebayo
                            </h2>
                            <div className="flex flex-wrap gap-2.5 mb-8">
                                <span className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                    <Code2 size={16} className="text-blue-500" /> Full Stack Engineer
                                </span>
                                <span className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                    <GraduationCap size={16} className="text-orange-500" /> FUTA Alumnus
                                </span>
                            </div>
                            
                            <p className="text-zinc-600 dark:text-zinc-300 text-lg leading-relaxed font-medium">
                                Passionate about creating seamless digital experiences. Built <span className="text-zinc-900 dark:text-white font-black">Ask Me</span> from the ground up to provide a safe, anonymous space for everyone. Always open to new opportunities and technical collaborations.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 shrink-0 pt-4">
                            <a 
                                href="https://wa.me/2349167689200" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-8 py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-95 text-xl"
                            >
                                <MessageCircle size={28} />
                                Chat on WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-zinc-800 p-6 flex justify-between items-center transition-colors">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        Available for hire
                    </span>
                    <ExternalLink size={18} className="text-zinc-300 dark:text-zinc-600 group-hover:text-pink-500 transition-colors" />
                </div>
            </section>
         </div>
      </div>
    </div>
  );
};

export default Settings;
