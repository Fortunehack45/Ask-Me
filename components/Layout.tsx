
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
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
        if (token && userProfile) {
          await saveFCMToken(userProfile.uid, token);
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
      <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white relative overflow-x-hidden">
        <div className="bg-noise"></div>
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

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans relative transition-colors duration-300 overflow-x-hidden">
      
      {/* Background Studio Aura - Subtle */}
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden">
        <div className="bg-noise absolute inset-0"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-pink-500/5 dark:bg-pink-600/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-white/5 shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">A</div>
          <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 p-2"><LogOut size={20} /></button>
      </header>

      {/* CLASSIC SIDEBAR - Based on screenshot */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 z-40 flex-col py-10 px-6">
        <Link to="/" className="flex items-center gap-3 px-3 mb-12 group">
           <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform">A</div>
           <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Ask Me</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400">Studio v1.5</span>
           </div>
        </Link>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                  isActive 
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {notificationPermission === 'default' && (
            <button 
              onClick={enableNotifications}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-500 hover:text-pink-500 hover:bg-pink-500/5 mt-4 transition-all font-bold text-sm"
            >
              <Bell size={20} />
              <span>Enable Alerts</span>
            </button>
          )}
        </nav>

        <div className="mt-auto border-t border-zinc-100 dark:border-white/5 pt-6">
          <div className="flex items-center gap-3 p-2 rounded-2xl">
             <img 
               src={userProfile.avatar} 
               alt="Me" 
               className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm" 
             />
             <div className="flex-1 min-w-0">
               <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{userProfile.fullName}</p>
               <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-widest">@{userProfile.username}</p>
             </div>
             <button onClick={handleLogout} title="Logout" className="text-zinc-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>

      {/* FULL SCREEN MAIN AREA */}
      <main className="w-full md:pl-64 min-h-screen relative z-[5]">
        <div className="w-full h-full px-6 md:px-10 pt-24 pb-32 md:py-12 transition-all">
           {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV - Simplified */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={clsx(
                  "flex items-center justify-center w-full h-full transition-all",
                  isActive ? "text-pink-500" : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                <div className={clsx(
                  "p-2.5 rounded-xl transition-all",
                  isActive && "bg-pink-500/10"
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
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
