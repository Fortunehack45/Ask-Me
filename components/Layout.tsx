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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [loadingNotifs, setLoadingNotifs] = useState(false);

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

  if (!userProfile) {
    return (
      <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans selection:bg-pink-500/30 overflow-hidden relative transition-colors duration-300">
        <div className="bg-noise"></div>
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
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Profile', path: `/u/${userProfile.username}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  }

  const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses: Record<string, string> = {
      sm: 'w-10 h-10 rounded-xl text-lg',
      md: 'w-12 h-12 rounded-2xl text-2xl',
      lg: 'w-16 h-16 rounded-[22px] text-3xl'
    };
    const currentClass = sizeClasses[size] || sizeClasses.md;

    return (
      <div className={clsx(
        "bg-mesh-pink flex items-center justify-center text-white font-black shadow-2xl relative overflow-hidden",
        currentClass
      )}>
        <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
        <span className="relative z-10 translate-y-[5%] drop-shadow-lg">A</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-500 overflow-x-hidden">
      
      {/* Background Studio Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="bg-noise absolute inset-0"></div>
        <div className="absolute top-[-30%] left-[-15%] w-[1000px] h-[1000px] bg-pink-500/10 dark:bg-pink-600/5 rounded-full blur-[180px] animate-blob opacity-60"></div>
        <div className="absolute top-[20%] right-[-30%] w-[800px] h-[800px] bg-orange-500/10 dark:bg-orange-600/5 rounded-full blur-[160px] animate-blob animation-delay-2000 opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[1000px] h-[1000px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[180px] animate-blob animation-delay-4000 opacity-40"></div>
      </div>

      {/* Mobile Top Branding */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 py-5 flex justify-center items-center backdrop-blur-3xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-white/5 shadow-sm transition-all">
        <Link to="/" className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
      </header>

      {/* Side Navigation - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-80 border-r border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[60px] z-40 flex-col justify-between py-12 px-8 transition-all">
        <div>
          <Link to="/" className="flex items-center gap-5 px-3 mb-16 group">
             <Logo size="md" />
             <div className="flex flex-col">
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter group-hover:text-pink-600 transition-colors leading-none">Ask Me</span>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mt-1.5">Studio v1.5</span>
             </div>
          </Link>

          <nav className="space-y-3.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-5 px-7 py-5.5 rounded-[32px] transition-all group relative overflow-hidden",
                    isActive ? "text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill" 
                      className="absolute inset-0 bg-white dark:bg-white/10 rounded-[32px] shadow-[0_10px_40px_rgb(0,0,0,0.1)] dark:shadow-none border border-zinc-100 dark:border-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    ></motion.div>
                  )}
                  <div className={clsx("relative z-10 transition-transform duration-300 group-hover:scale-110", isActive ? "text-pink-600 dark:text-pink-500" : "")}>
                    <item.icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={clsx("text-xl font-bold relative z-10", isActive ? "" : "font-semibold")}>{item.name}</span>
                </Link>
              );
            })}

            {notificationPermission === 'default' && (
              <button 
                onClick={enableNotifications}
                disabled={loadingNotifs}
                className="w-full flex items-center gap-5 px-7 py-5.5 rounded-[32px] transition-all group relative overflow-hidden text-zinc-500 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-500/10 mt-8 border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-pink-500/40"
              >
                <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                  <Bell size={28} />
                </div>
                <span className="text-xl font-semibold relative z-10">
                  {loadingNotifs ? 'Setting up...' : 'Whisper Alerts'}
                </span>
              </button>
            )}
          </nav>
        </div>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-4 p-5 rounded-[32px] bg-white/60 dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/10 hover:border-pink-500/40 transition-all cursor-pointer group hover:shadow-2xl">
             <div className="relative">
                <img 
                  src={userProfile.avatar} 
                  alt="Me" 
                  className="w-14 h-14 rounded-3xl bg-zinc-200 dark:bg-zinc-800 object-cover ring-4 ring-transparent group-hover:ring-pink-500/25 transition-all shadow-lg" 
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900 shadow-sm"></div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-base font-black text-zinc-900 dark:text-white truncate">{userProfile.fullName}</p>
               <p className="text-[10px] font-black text-zinc-500 truncate uppercase tracking-[0.2em] mt-0.5">@{userProfile.username}</p>
             </div>
             <button onClick={handleLogout} title="Logout" className="text-zinc-400 hover:text-red-500 p-3 rounded-2xl hover:bg-red-500/10 transition-all active:scale-90">
                <LogOut size={22} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Fluidly Responsive */}
      <main className="w-full md:pl-80 min-h-screen relative z-10">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 md:px-16 pt-32 pb-48 md:py-24 transition-all">
           {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Glass Pill Style */}
      <nav className="md:hidden fixed bottom-10 left-6 right-6 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-[40px] border border-white/40 dark:border-white/10 rounded-[44px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] pb-safe">
        <div className="flex justify-around items-center h-[88px] px-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={clsx(
                  "transition-all duration-500 p-4.5 rounded-[24px] flex items-center justify-center relative",
                  isActive ? "text-white bg-mesh-pink shadow-[0_15px_40px_-5px_rgba(236,72,153,0.5)] scale-115 -translate-y-3" : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {isActive && <div className="absolute -top-3 w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping"></div>}
                  <item.icon size={26} strokeWidth={isActive ? 3 : 2} />
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