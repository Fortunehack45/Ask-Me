import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, getMessagingInstance } from '../firebase';
import { getToken } from 'firebase/messaging';
import { saveFCMToken } from '../services/db';
import { Home, Inbox, User, LogOut, LayoutDashboard, Bell, Settings } from './Icons';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    // Check permission on mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  const enableNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        alert("Notifications are not supported in this browser.");
        setLoadingNotifs(false);
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const vapidKey = 'REPLACE_WITH_YOUR_VAPID_KEY'; 
        if (vapidKey === 'REPLACE_WITH_YOUR_VAPID_KEY') {
            console.warn("VAPID Key not configured.");
            setLoadingNotifs(false);
            return;
        }

        const token = await getToken(messaging, { vapidKey });
        if (token && userProfile) {
          await saveFCMToken(userProfile.uid, token);
          alert("Notifications enabled!");
        }
      }
    } catch (error) {
      console.error("Error enabling notifications", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Auth pages (no profile yet) get a simple layout
  if (!userProfile) {
    return (
      <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans selection:bg-pink-500/30 overflow-hidden relative transition-colors duration-300">
        <div className="bg-noise"></div>
         {/* Ambient Lights */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-500/20 dark:bg-pink-900/20 rounded-full blur-[120px] mix-blend-screen opacity-40"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/20 dark:bg-orange-900/20 rounded-full blur-[120px] mix-blend-screen opacity-40"></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    );
  }

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Profile', path: `/u/${userProfile.username}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col lg:flex-row relative selection:bg-pink-500/30">
      
      {/* Background Elements - Fixed z-0 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="bg-noise absolute inset-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-pink-400/10 dark:bg-pink-600/5 rounded-full blur-[140px] mix-blend-screen animate-blob opacity-40"></div>
        <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000 opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] bg-orange-400/10 dark:bg-orange-600/5 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 opacity-30"></div>
      </div>

      {/* --- MOBILE & TABLET HEADER --- */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-white/5 transition-all duration-300">
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(236,72,153,0.3)]">A</span>
          <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Ask Me</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 active:scale-95 transition-transform"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl z-40 flex-col justify-between py-8 px-6 transition-colors duration-300">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-2 mb-12 group">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-105 transition-transform">A</div>
             <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-pink-600 dark:group-hover:text-pink-100 transition-colors">Ask Me</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-4 px-4 py-4 rounded-[24px] transition-all group relative overflow-hidden",
                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                  )}
                >
                  {isActive && <div className="absolute inset-0 bg-white/80 dark:bg-white/5 rounded-[24px] shadow-sm dark:shadow-none border border-zinc-200 dark:border-transparent"></div>}
                  <div className={clsx("relative z-10", isActive ? "text-pink-600 dark:text-pink-500" : "group-hover:text-zinc-900 dark:group-hover:text-white transition-colors")}>
                    <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={clsx("text-lg font-medium relative z-10", isActive ? "font-bold" : "")}>{item.name}</span>
                </Link>
              );
            })}

            {/* Notification Button (Desktop) */}
            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                disabled={loadingNotifs}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-[24px] transition-all group relative overflow-hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-pink-500/10 mt-4 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-pink-500/50"
              >
                <div className="relative z-10 group-hover:text-pink-500 transition-colors">
                  <Bell size={26} />
                </div>
                <span className="text-lg font-medium relative z-10 group-hover:text-pink-600 dark:group-hover:text-pink-100">
                  {loadingNotifs ? 'Enabling...' : 'Enable Notifs'}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* User Mini Profile */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 hover:border-pink-500/30 transition-all cursor-pointer group hover:bg-white/80 dark:hover:bg-zinc-900/60 shadow-sm dark:shadow-none">
             <img 
               src={userProfile.avatar} 
               alt="Me" 
               className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover ring-2 ring-transparent group-hover:ring-pink-500/30 transition-all" 
             />
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{userProfile.fullName}</p>
               <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-400">@{userProfile.username}</p>
             </div>
             <button onClick={handleLogout} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full lg:pl-64 min-h-screen relative z-10">
        {/* Added pb-40 to ensure content is fully visible above the floating nav */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-40 lg:py-10">
           {children}
        </div>
      </main>

      {/* --- MOBILE & TABLET BOTTOM NAV (FLOATING) --- */}
      <nav className="lg:hidden fixed bottom-8 left-6 right-6 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] shadow-2xl shadow-black/20 pb-safe">
        <div className="flex justify-around items-center h-[70px] px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={clsx(
                  "transition-all duration-300 p-3 rounded-2xl flex items-center justify-center",
                  isActive ? "text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 shadow-lg scale-110" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;