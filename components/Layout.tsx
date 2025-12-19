import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken } from '../services/db';
import { Home, Inbox, User, LogOut, LayoutDashboard, Bell, Settings, ChevronRight } from './Icons';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const LogoIcon = ({ className = "w-10 h-10", textClassName = "text-lg" }) => (
  <div className={clsx("relative shrink-0 flex items-center justify-center", className)}>
    {/* Squircle Background with Premium Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#ff0080] to-[#ff8c00] rounded-[30%] shadow-[0_10px_30px_-5px_rgba(255,0,128,0.4)]" />
    {/* Optical rim highlight */}
    <div className="absolute inset-[1px] rounded-[30%] border border-white/20 pointer-events-none" />
    <span className={clsx("relative z-10 font-black text-white tracking-tighter pt-0.5 select-none", textClassName)}>Am</span>
  </div>
);

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
      <main className="min-h-screen w-full bg-zinc-50 dark:bg-[#050506] text-zinc-900 dark:text-white relative overflow-x-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        <div className="relative z-10">{children}</div>
      </main>
    );
  }

  const navGroups = [
    {
      label: 'Studio',
      items: [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Inbox', path: '/inbox', icon: Inbox },
        { name: 'My Profile', path: `/u/${userProfile.username}`, icon: User },
      ]
    },
    {
      label: 'System',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
        ...(isAdmin ? [{ name: 'Admin HQ', path: '/admin', icon: LayoutDashboard }] : []),
      ]
    }
  ];

  const mobileNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: `/u/${userProfile.username}`, icon: User },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-[#fdfdfd] dark:bg-[#050506] text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-700 overflow-x-hidden">
      
      {/* Immersive Cinematic Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.06]"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-pink-500/15 dark:bg-pink-600/[0.03] rounded-full blur-[160px] animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-indigo-500/15 dark:bg-indigo-600/[0.03] rounded-full blur-[160px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Mobile Top Header - Liquid Glass */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-18 flex justify-between items-center backdrop-blur-[48px] bg-white/70 dark:bg-[#050506]/70 border-b border-zinc-200/50 dark:border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <LogoIcon className="w-9 h-9" textClassName="text-base" />
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 p-2.5 bg-zinc-100 dark:bg-white/5 rounded-2xl active:scale-90">
          <LogOut size={18} />
        </button>
      </header>

      {/* PRO SIDEBAR - FULL HEIGHT INTEGRATED */}
      <aside className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-[280px] border-r border-zinc-200/50 dark:border-white/5 bg-[#ffffff]/60 dark:bg-zinc-950/60 backdrop-blur-[80px] z-40 flex-col">
        
        {/* Sidebar Rim Highlight */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 dark:bg-white/5 pointer-events-none" />

        <div className="pt-12 pb-10 px-8 shrink-0">
          <Link to="/" className="flex items-center gap-4 group">
            <LogoIcon className="w-12 h-12" textClassName="text-xl" />
            <div className="flex flex-col">
              <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">Ask Me</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-pink-500 opacity-80">Pro Studio</span>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-10 overflow-y-auto no-scrollbar py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">{group.label}</p>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link 
                    key={item.name} 
                    to={item.path}
                    className={clsx(
                      "relative group flex items-center justify-between px-5 py-3.5 rounded-[20px] transition-all font-bold text-[14px]",
                      isActive 
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]" 
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon 
                        size={18} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={clsx("transition-all", isActive ? "scale-110" : "group-hover:text-pink-500")} 
                      />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}

          {notificationPermission === 'default' && (
            <div className="pt-6 border-t border-zinc-100 dark:border-white/5">
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[20px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-all font-bold text-[14px]"
              >
                <Bell size={18} />
                <span>Enable Alerts</span>
              </button>
            </div>
          )}
        </nav>

        {/* Improved Profile Well */}
        <div className="p-4 mt-auto">
          <div className="bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/5 p-3 rounded-[24px] flex items-center gap-3 transition-all hover:bg-zinc-100 dark:hover:bg-white/5">
             <img 
               src={userProfile.avatar} 
               className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-white/5" 
             />
             <div className="flex-1 min-w-0">
               <p className="text-[13px] font-black text-zinc-900 dark:text-white truncate leading-none mb-1">{userProfile.fullName}</p>
               <p className="text-[8px] font-black text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-xl hover:bg-white dark:hover:bg-white/5"
             >
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* FULL WIDTH MAIN CONTENT AREA */}
      <main className="md:pl-[280px] pt-18 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 lg:p-10 w-full animate-in fade-in duration-1000">
          {children}
        </div>
      </main>

      {/* MOBILE NAV - FLOATING PILL */}
      <nav className="md:hidden fixed bottom-6 inset-x-6 z-50 h-16 glass-liquid-v2 rounded-[30px] flex items-center justify-around px-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] border border-white/30 dark:border-white/10">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={clsx(
                "p-3 rounded-2xl transition-all relative",
                isActive ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-lg scale-110" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;