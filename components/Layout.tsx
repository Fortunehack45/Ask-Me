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
    <div className="absolute inset-0 bg-gradient-to-br from-[#ff0080] to-[#ff8c00] rounded-[28%] rotate-0 shadow-lg" />
    <span className={clsx("relative z-10 font-black text-white tracking-tighter pt-0.5", textClassName)}>Am</span>
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
      label: 'Main Portal',
      items: [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Inbox', path: '/inbox', icon: Inbox },
        { name: 'My Profile', path: `/u/${userProfile.username}`, icon: User },
      ]
    },
    {
      label: 'Configuration',
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
      
      {/* Immersive Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.06]"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[80vw] h-[80vw] bg-pink-500/10 dark:bg-pink-600/[0.02] rounded-full blur-[140px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[80vw] h-[80vw] bg-indigo-500/10 dark:bg-indigo-600/[0.02] rounded-full blur-[140px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Mobile Top Header - Liquid Glass */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-18 flex justify-between items-center backdrop-blur-[40px] bg-white/60 dark:bg-[#050506]/60 border-b border-zinc-200/50 dark:border-white/5 shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <LogoIcon className="w-9 h-9" textClassName="text-base" />
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
        <div className="flex items-center gap-3">
           <button onClick={handleLogout} className="text-zinc-400 p-2.5 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-white/5 rounded-2xl active:scale-90">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ULTRA-PROFESSIONAL SIDEBAR (SIDEBAR 2.0) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-[300px] border-r border-zinc-200/50 dark:border-white/5 bg-[#ffffff]/70 dark:bg-zinc-950/70 backdrop-blur-[64px] z-40 flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
        
        {/* Logo Section */}
        <div className="pt-12 pb-10 px-10 shrink-0">
          <Link to="/" className="flex items-center gap-5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
              <LogoIcon className="w-13 h-13" textClassName="text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1.5">Ask Me</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-500 opacity-80">Studio Hub</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-6 space-y-10 overflow-y-auto no-scrollbar py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="px-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.35em] mb-5">{group.label}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link 
                      key={item.name} 
                      to={item.path}
                      className={clsx(
                        "relative group flex items-center justify-between px-6 py-4 rounded-[22px] transition-all font-bold text-[14px]",
                        isActive 
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] scale-[1.02]" 
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon 
                          size={20} 
                          strokeWidth={isActive ? 2.5 : 2}
                          className={clsx("transition-all", isActive ? "scale-110" : "group-hover:text-pink-500")} 
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight size={14} strokeWidth={3} className="opacity-50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* System/Utilities */}
          {notificationPermission === 'default' && (
            <div className="pt-6 border-t border-zinc-100 dark:border-white/5 space-y-2">
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-[22px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-all font-bold text-[14px]"
              >
                <Bell size={20} />
                <span>Enable Alerts</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Profile Well */}
        <div className="p-6 pb-8 shrink-0">
          <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/5 p-4 rounded-[28px] flex items-center gap-4 transition-all hover:bg-zinc-100 dark:hover:bg-white/5 shadow-sm">
             <div className="relative shrink-0">
               <img 
                 src={userProfile.avatar} 
                 alt="Avatar" 
                 className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-white/10" 
               />
               <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-[#101012]"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[14px] font-black text-zinc-900 dark:text-white truncate leading-none mb-1.5">{userProfile.fullName}</p>
               <p className="text-[9px] font-black text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2.5 text-zinc-400 hover:text-red-500 transition-colors rounded-xl bg-white dark:bg-white/5 shadow-sm border border-zinc-100 dark:border-white/5"
             >
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      <main className="md:pl-[300px] pt-18 md:pt-0">
        <div className="p-6 md:p-14 lg:p-20 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* FLOATING MOBILE BOTTOM NAVIGATION - LIQUID GLASS 2.0 */}
      <nav className="md:hidden fixed bottom-6 inset-x-6 z-50 h-18 glass-liquid-v2 rounded-[32px] flex items-center justify-around px-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] border border-white/30 dark:border-white/10">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={clsx(
                "p-3.5 rounded-2xl transition-all relative",
                isActive ? "bg-zinc-950 dark:bg-white text-white dark:text-black shadow-lg scale-110" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div 
                  layoutId="activePillMobile"
                  className="absolute inset-0 rounded-2xl ring-2 ring-pink-500/10"
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