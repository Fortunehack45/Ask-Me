import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken } from '../services/db';
import { Home, Inbox, User, LogOut, LayoutDashboard, Bell, Settings } from './Icons';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  const enableNotifications = async () => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
        if (token && userProfile) {
          await saveFCMToken(userProfile.uid, token);
        }
      }
    } catch (error) {
      console.error("Error enabling notifications", error);
    }
  };

  if (!userProfile) {
    return (
      <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white relative overflow-x-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        <div className="relative z-10">{children}</div>
      </main>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Profile', path: `/u/${userProfile.username}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  }

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 dark:bg-[#050506] text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-700 overflow-x-hidden">
      
      {/* Immersive Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.05]"></div>
        <div className="absolute top-[-25%] right-[-15%] w-[120vw] h-[120vw] bg-pink-500/15 dark:bg-pink-600/[0.04] rounded-full blur-[180px] animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-15%] w-[120vw] h-[120vw] bg-blue-500/15 dark:bg-indigo-600/[0.04] rounded-full blur-[180px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Mobile Top Header - Liquid Glass */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-18 flex justify-between items-center backdrop-blur-[40px] bg-white/40 dark:bg-[#050506]/40 border-b border-white/20 dark:border-white/5 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ff0080] to-[#ff8c00] rounded-[11px] flex items-center justify-center text-white font-black shadow-lg shadow-pink-500/20 text-lg tracking-tighter pt-0.5">Am</div>
          <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
        <div className="flex items-center gap-2">
           <button onClick={handleLogout} className="text-zinc-400 p-2 hover:text-red-500 transition-colors active:scale-90 bg-zinc-100 dark:bg-white/5 rounded-full">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* APPLE-LEVEL LIQUID GLASS SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-76 border-r border-white/20 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[60px] z-40 flex-col shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Subtle top edge highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-white/50 dark:bg-white/10 pointer-events-none"></div>
        
        <div className="pt-14 pb-8 px-10 shrink-0 relative">
          <Link to="/" className="flex items-center gap-5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-15 h-15 bg-gradient-to-br from-[#ff0080] to-[#ff8c00] rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-[0_20px_40px_-10px_rgba(236,72,153,0.5)] group-hover:scale-105 transition-transform tracking-tighter pt-1">Am</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">Ask Me</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 opacity-80">Studio Pro</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto no-scrollbar">
          <p className="px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 mt-10 opacity-50">Navigation</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "relative group flex items-center gap-5 px-6 py-4.5 rounded-[26px] transition-all font-bold text-[15px] border border-transparent",
                  isActive 
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] scale-[1.02]" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-white/5 hover:border-white/20 dark:hover:border-white/5"
                )}
              >
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx("transition-all", isActive ? "scale-110" : "group-hover:text-pink-500")} 
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-10">
            <p className="px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 opacity-50">System</p>
            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-5 px-6 py-4.5 rounded-[26px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-white/5 transition-all font-bold text-[15px] border border-transparent hover:border-white/20 dark:hover:border-white/5"
              >
                <Bell size={24} />
                <span>Alerts</span>
              </button>
            )}
          </div>
        </nav>

        <div className="mt-auto p-6 pb-6 shrink-0">
          <div className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl p-5 rounded-[32px] flex items-center gap-4 transition-all hover:bg-white/70 dark:hover:bg-white/10 border border-white/20 dark:border-white/5">
             <div className="relative shrink-0">
               <img 
                 src={userProfile.avatar} 
                 alt="Avatar" 
                 className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white/30 dark:ring-white/10" 
               />
               <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-[#18181b]"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[15px] font-black text-zinc-900 dark:text-white truncate leading-none mb-2">{userProfile.fullName}</p>
               <p className="text-[10px] font-black text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2.5 text-zinc-400 hover:text-red-500 transition-colors rounded-xl bg-zinc-50 dark:bg-white/5"
             >
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>

      <main className="md:pl-76 pt-18 md:pt-0">
        <div className="p-6 md:p-12 lg:p-16">
          {children}
        </div>
      </main>

      {/* FLOATING MOBILE BOTTOM NAVIGATION - LIQUID GLASS */}
      <nav className="md:hidden fixed bottom-6 inset-x-6 z-50 h-18 bg-white/50 dark:bg-[#050506]/50 backdrop-blur-[45px] rounded-[36px] border border-white/30 dark:border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] flex items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={clsx(
                "p-3.5 rounded-[22px] transition-all relative",
                isActive ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-lg scale-110" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div 
                  layoutId="activePill"
                  className="absolute inset-0 rounded-[22px] ring-2 ring-pink-500/20"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;