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
      if (!messaging) {
        alert("Notifications are not supported in this browser.");
        return;
      }
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
        <div className="bg-noise"></div>
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
    <div className="min-h-screen w-full bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-300 overflow-x-hidden">
      
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        <div className="absolute -top-[10%] -right-[10%] w-[100vw] h-[100vw] bg-pink-500/5 dark:bg-pink-500/[0.02] rounded-full blur-[160px] animate-blob"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[100vw] h-[100vw] bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-full blur-[160px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Mobile Glass Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-16 flex justify-between items-center backdrop-blur-[32px] bg-white/70 dark:bg-zinc-950/70 border-b border-white/20 dark:border-white/5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-pink-500/20">A</div>
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Ask Me</span>
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 p-2 hover:text-red-500 transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* ADAPTIVE APPLE-STYLE SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-72 border-r border-white/10 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[50px] z-40 flex-col shadow-2xl">
        {/* Branding (Fixed) */}
        <div className="pt-12 pb-8 px-8 shrink-0">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-pink-500/20 group-hover:scale-105 transition-transform">A</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">Ask Me</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-500">PRO STUDIO</span>
            </div>
          </Link>
        </div>

        {/* Scrollable Middle Content */}
        <nav className="flex-1 px-5 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          <p className="px-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 mt-6">Navigation</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "relative group flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all font-bold text-[15px]",
                  isActive 
                    ? "bg-zinc-900/5 dark:bg-white/10 text-zinc-950 dark:text-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-1.5 w-1.5 h-6 bg-pink-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                )}
                <item.icon 
                  size={22} 
                  className={clsx("transition-colors", isActive ? "text-pink-500" : "group-hover:text-pink-500/70")} 
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-6">
            <p className="px-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 mt-6">System</p>
            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all font-bold text-[15px]"
              >
                <Bell size={22} />
                <span>Alerts</span>
              </button>
            )}
          </div>
        </nav>

        {/* User Footer (Fixed Bottom within Sidebar) */}
        <div className="mt-auto p-5 pb-10 shrink-0">
          <div className="bg-zinc-500/5 dark:bg-white/5 border border-white/10 dark:border-white/5 p-4 rounded-[28px] flex items-center gap-3.5 transition-all hover:bg-zinc-500/10 dark:hover:bg-white/10">
             <div className="relative shrink-0">
               <img 
                 src={userProfile.avatar} 
                 alt="Avatar" 
                 className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm ring-2 ring-white/10" 
               />
               <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3.5px] border-white dark:border-zinc-950"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[15px] font-black text-zinc-900 dark:text-white truncate leading-none mb-1.5">{userProfile.fullName}</p>
               <p className="text-[10px] font-black text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout} 
                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
              >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </aside>

      {/* FULL HORIZON CONTENT AREA */}
      <main className="w-full md:pl-72 min-h-screen relative z-10">
        <div className="w-full px-6 md:px-12 pt-24 pb-32 md:py-20 max-w-[1920px] mx-auto transition-all">
           {children}
        </div>
      </main>

      {/* LIQUID GLASS MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-20 px-2 flex items-center justify-around rounded-[40px] overflow-hidden">
        {/* Multi-layer Glass Material */}
        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[40px] border border-white/20 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-20 pointer-events-none"></div>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full transition-all relative z-10",
                isActive ? "text-pink-500" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="liquidPill"
                  className="absolute inset-2.5 rounded-[28px] bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/20"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                />
              )}
              <div className={clsx("relative z-10 p-2.5 transition-all duration-300", isActive && "scale-110")}>
                <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <motion.div 
                  layoutId="mobileGlowDot"
                  className="absolute bottom-2 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_12px_rgba(236,72,153,1)]"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
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