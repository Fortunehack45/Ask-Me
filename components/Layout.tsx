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
      
      {/* Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0"></div>
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-pink-500/5 dark:bg-pink-500/[0.03] rounded-full blur-[200px]"></div>
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-blue-500/5 dark:bg-blue-500/[0.03] rounded-full blur-[200px]"></div>
      </div>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-16 flex justify-between items-center backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-white/[0.03]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-pink-500/20">A</div>
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Ask Me</span>
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 p-2 hover:text-red-500 transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* REFINED FULL-HEIGHT SCROLLABLE SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 border-r border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-[#09090b] z-40 flex-col shadow-sm">
        {/* Branding Area (Static) */}
        <div className="pt-10 pb-6 px-8 shrink-0">
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-11 h-11 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-pink-500/20 group-hover:scale-105 transition-transform">A</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight">Ask Me</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Professional Studio</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Middle Section */}
        <nav className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-1">
          <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">Main Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "relative group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all font-semibold text-[14px]",
                  isActive 
                    ? "bg-zinc-100 dark:bg-white/[0.05] text-zinc-950 dark:text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-5 bg-pink-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={clsx("transition-colors", isActive ? "text-pink-500" : "group-hover:text-pink-500/70")} 
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-6">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">Community</p>
            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all font-semibold text-[14px]"
              >
                <Bell size={20} />
                <span>Enable Alerts</span>
              </button>
            )}
          </div>
        </nav>

        {/* User Footer (Static/Sticky at the bottom of sidebar) */}
        <div className="p-5 mt-auto border-t border-zinc-100 dark:border-white/[0.03] bg-white dark:bg-[#09090b] shrink-0">
          <div className="group bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.03] p-3 rounded-2xl flex items-center gap-3 transition-all hover:border-zinc-200 dark:hover:border-white/[0.08]">
             <div className="relative shrink-0">
               <img 
                 src={userProfile.avatar} 
                 alt="Avatar" 
                 className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm group-hover:scale-105 transition-transform" 
               />
               <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-white dark:border-zinc-900"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-zinc-900 dark:text-white truncate leading-none mb-1">{userProfile.fullName}</p>
               <p className="text-[10px] font-semibold text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout} 
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                title="Logout"
              >
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>

      {/* EXPANDED CONTENT AREA */}
      <main className="w-full md:pl-72 min-h-screen relative z-10">
        <div className="w-full h-full px-6 md:px-10 lg:px-14 pt-24 pb-32 md:py-16 max-w-[1600px] mx-auto transition-all">
           {children}
        </div>
      </main>

      {/* LIQUID GLASS MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 rounded-[32px] overflow-hidden group">
        {/* Surface Material */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[32px] border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-none"></div>
        
        {/* Top Edge Highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></div>
        
        <div className="flex justify-around items-center h-16 px-4 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-full transition-all relative z-10",
                  isActive ? "text-pink-500" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {/* LIQUID PILL ACTIVE INDICATOR */}
                {isActive && (
                  <motion.div 
                    layoutId="liquidPill"
                    className="absolute inset-1.5 rounded-2xl bg-pink-500/10 dark:bg-pink-500/20 shadow-[inset_0_0_12px_rgba(236,72,153,0.1)] border border-pink-500/20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div className={clsx(
                  "relative z-10 p-2 transition-all duration-300",
                  isActive && "scale-110"
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Subtle Glow Dot */}
                {isActive && (
                  <motion.div 
                    layoutId="mobileGlowDot"
                    className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;