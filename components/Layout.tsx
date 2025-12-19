import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken } from '../services/db';
import { Home, Inbox, User, LogOut, LayoutDashboard, Bell, Settings, Code2 } from './Icons';
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
    <div className="min-h-[100dvh] w-full bg-white dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-500 overflow-x-hidden">
      
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-pink-500/10 dark:bg-pink-500/[0.03] rounded-full blur-[160px] animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-blue-500/10 dark:bg-blue-500/[0.03] rounded-full blur-[160px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 h-16 flex justify-between items-center backdrop-blur-[32px] bg-white/70 dark:bg-[#070708]/70 border-b border-zinc-100 dark:border-white/5 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-pink-500/20">A</div>
          <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 p-2 hover:text-red-500 transition-colors active:scale-90">
          <LogOut size={20} />
        </button>
      </header>

      {/* APPLE-LEVEL ADAPTIVE SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-72 border-r border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[50px] z-40 flex-col shadow-2xl overflow-hidden">
        {/* Branding (Fixed) */}
        <div className="pt-12 pb-8 px-8 shrink-0 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-white/40 dark:bg-white/10 pointer-events-none"></div>
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-pink-500/20 group-hover:scale-105 transition-transform">A</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">Ask Me</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">PRO STUDIO</span>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-5 py-2 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-4 mt-8 opacity-60">Management</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "relative group flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all font-bold text-[15px]",
                  isActive 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5"
                )}
              >
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx("transition-all", isActive ? "scale-110" : "group-hover:text-pink-500/80")} 
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-8">
            <p className="px-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-4 opacity-60">Preferences</p>
            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-[24px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all font-bold text-[15px]"
              >
                <Bell size={22} />
                <span>Alerts</span>
              </button>
            )}
          </div>
        </nav>

        {/* Profile Footer (Fixed) */}
        <div className="mt-auto p-5 pb-4 shrink-0 border-t border-zinc-100 dark:border-white/5">
          <div className="bg-zinc-50/80 dark:bg-white/5 p-4 rounded-[30px] flex items-center gap-3.5 transition-all hover:bg-zinc-100 dark:hover:bg-white/10 mb-4">
             <div className="relative shrink-0">
               <img 
                 src={userProfile.avatar} 
                 alt="Avatar" 
                 className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm ring-2 ring-white/20" 
               />
               <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3.5px] border-white dark:border-zinc-900"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[14px] font-black text-zinc-900 dark:text-white truncate leading-none mb-1.5">{userProfile.fullName}</p>
               <p className="text-[9px] font-black text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button 
                onClick={handleLogout} 
                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
              >
                <LogOut size={20} />
             </button>
          </div>
          
          {/* Subtle Dev Signature */}
          <a 
            href="https://wa.me/2349167689200" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 text-zinc-300 dark:text-zinc-600 hover:text-pink-500 transition-all group"
          >
            <Code2 size={12} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Handcrafted by Esho</span>
          </a>
        </div>
      </aside>

      {/* FULL HORIZON CONTENT AREA */}
      <main className="w-full md:pl-72 min-h-screen relative z-10">
        <div className="w-full px-6 md:px-12 lg:px-16 pt-24 pb-32 md:py-20 max-w-[1920px] mx-auto transition-all">
           {children}
        </div>
      </main>

      {/* LIQUID GLASS MOBILE BOTTOM NAV (Removed Dots) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-20 px-2 flex items-center justify-around rounded-[40px] overflow-hidden">
        {/* Layered Glass Surface */}
        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[40px] border border-white/20 dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5)] pointer-events-none"></div>
        <div className="absolute inset-x-0 top-0 h-px bg-white/20 dark:bg-white/10 pointer-events-none"></div>
        
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
                  className="absolute inset-2.5 rounded-[28px] bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/20 shadow-inner"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <div className={clsx("relative z-10 p-2.5 transition-all duration-300", isActive && "scale-125")}>
                <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;