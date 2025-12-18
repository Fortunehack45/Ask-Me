import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminAnalytics } from '../services/db';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, Activity, Loader2, TrendingUp, Users, Clock, ArrowUpRight, X
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import clsx from 'clsx';

interface ChartDataPoint {
  name: string;
  'New Users': number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const Admin: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin) {
        const data = await getAdminAnalytics();
        setUsers(data);
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const active24h = users.filter(u => {
      if (!u.lastActive) return false;
      // Normalizing lastActive to a number safely
      let ts = 0;
      if (typeof u.lastActive === 'number') {
        ts = u.lastActive;
      } else if (u.lastActive && typeof u.lastActive === 'object' && 'toMillis' in u.lastActive) {
        ts = u.lastActive.toMillis();
      }
      return ts > 0 && (now - ts) < oneDay;
    }).length;
    
    let rangeMillis = oneWeek;
    if (timeRange === '24h') rangeMillis = oneDay;
    if (timeRange === '30d') rangeMillis = oneMonth;
    if (timeRange === 'all') rangeMillis = now;

    const newUsersInRange = users.filter(u => (now - u.createdAt) < rangeMillis).length;
    const prevUsersInRange = users.filter(u => {
        const age = now - u.createdAt;
        return age >= rangeMillis && age < (rangeMillis * 2);
    }).length;
    
    const growth = prevUsersInRange === 0 ? 100 : Math.round(((newUsersInRange - prevUsersInRange) / prevUsersInRange) * 100);

    return { total: users.length, active: active24h, new: newUsersInRange, growth };
  }, [users, timeRange]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const now = Date.now();
    const dataPoints: ChartDataPoint[] = [];
    
    if (timeRange === '24h') {
        for (let i = 23; i >= 0; i--) {
            const start = now - (i + 1) * 3600000;
            const end = now - i * 3600000;
            const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
            dataPoints.push({ name: new Date(start).getHours() + ':00', 'New Users': count });
        }
    } else if (timeRange === '7d') {
        for (let i = 6; i >= 0; i--) {
            const start = now - (i + 1) * 86400000;
            const end = now - i * 86400000;
            const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
            dataPoints.push({ name: new Date(start).toLocaleDateString('en-US', { weekday: 'short' }), 'New Users': count });
        }
    } else {
        const count = users.length;
        dataPoints.push({ name: 'Total', 'New Users': count });
    }
    return dataPoints;
  }, [users, timeRange]);

  const filteredUsers = useMemo(() => {
      if (!searchQuery) return users;
      const lowerQ = searchQuery.toLowerCase();
      return users.filter(u => 
          u.username.toLowerCase().includes(lowerQ) || 
          u.fullName.toLowerCase().includes(lowerQ)
      );
  }, [users, searchQuery]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div className="flex h-[80vh] w-full justify-center items-center text-pink-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-pink-600" size={32} /> Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Platform insights and management.</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            {(['24h', '7d', '30d', 'all'] as const).map((t) => (
                <button key={t} onClick={() => setTimeRange(t)} className={clsx("px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all", timeRange === t ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800")}>{t}</button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats.total} icon={Users} trend="+12%" trendUp={true} color="blue" />
        <StatsCard title="Active (24h)" value={stats.active} icon={Activity} trend="+5%" trendUp={true} color="green" />
        <StatsCard title="New Users" value={stats.new} subtitle={`Last ${timeRange}`} icon={TrendingUp} trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth}%`} trendUp={stats.growth >= 0} color="orange" />
        <StatsCard title="Retention" value={stats.total > 0 ? Math.round((stats.active/stats.total)*100) + '%' : '0%'} icon={Clock} trend="-2%" trendUp={false} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-8">User Growth</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="New Users" stroke="#ec4899" strokeWidth={3} fill="url(#colorUsers)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Users</h3>
                <button onClick={() => setShowAllUsers(true)} className="text-sm font-bold text-pink-600 dark:text-pink-400 hover:underline">View All</button>
            </div>
            <div className="space-y-4 flex-1">
                {users.slice(0, 5).map(u => (
                    <div key={u.uid} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{u.fullName}</p>
                            <p className="text-xs text-zinc-500">@{u.username}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showAllUsers && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllUsers(false)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[32px] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">All Users</h2>
                        <button onClick={() => setShowAllUsers(false)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <input type="text" placeholder="Search users by name or id..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-6 mb-6 outline-none focus:ring-2 focus:ring-pink-500/50 transition-all" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredUsers.map(u => (
                                <div key={u.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 group">
                                    <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-900 dark:text-white truncate">{u.fullName}</p>
                                        <p className="text-xs text-zinc-500">@{u.username}</p>
                                    </div>
                                    <a href={`#/u/${u.username}`} target="_blank" rel="noopener noreferrer" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-pink-500"><ArrowUpRight size={20} /></a>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, subtitle, color }) => {
    const colorStyles = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        green: 'bg-green-500/10 text-green-600 dark:text-green-400',
        orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }[color];

    return (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorStyles} transition-transform group-hover:scale-110`}><Icon size={24} /></div>
                {trend && <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{trend}</div>}
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</h3>
            <p className="text-zinc-500 text-sm font-bold mt-1">{title} {subtitle && <span className="text-[10px] font-normal opacity-70">({subtitle})</span>}</p>
        </div>
    );
};

export default Admin;