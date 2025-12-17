import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminAnalytics } from '../services/db';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, User, Activity, Loader2, Calendar, 
  TrendingUp, Users, Clock, ArrowUpRight 
} from '../components/Icons';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import clsx from 'clsx';

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

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

  // --- ANALYTICS LOGIC ---
  const stats = useMemo(() => {
    const now = Date.now();
    const oneHour = 3600 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Active Users (Last 24h)
    const active24h = users.filter(u => u.lastActive && (now - u.lastActive) < oneDay).length;
    
    // New Users (In current time range)
    let rangeMillis = oneWeek; // default 7d
    if (timeRange === '24h') rangeMillis = oneDay;
    if (timeRange === '30d') rangeMillis = oneMonth;
    if (timeRange === 'all') rangeMillis = now; // roughly all time

    const newUsersInRange = users.filter(u => (now - u.createdAt) < rangeMillis).length;
    
    // Growth % (Simulated for demo if not enough history, typically requires separate historical DB)
    // Here we just compare to the previous period of same length
    const prevUsersInRange = users.filter(u => {
        const age = now - u.createdAt;
        return age >= rangeMillis && age < (rangeMillis * 2);
    }).length;
    
    const growth = prevUsersInRange === 0 ? 100 : Math.round(((newUsersInRange - prevUsersInRange) / prevUsersInRange) * 100);

    return {
      total: users.length,
      active: active24h,
      new: newUsersInRange,
      growth: growth
    };
  }, [users, timeRange]);

  const chartData = useMemo(() => {
    const now = Date.now();
    const dataPoints: any[] = [];
    
    if (timeRange === '24h') {
        // Hourly buckets
        for (let i = 23; i >= 0; i--) {
            const start = now - (i + 1) * 3600000;
            const end = now - i * 3600000;
            const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
            const active = users.filter(u => u.lastActive >= start && u.lastActive < end).length;
            const label = new Date(start).getHours() + ':00';
            dataPoints.push({ name: label, 'New Users': count, 'Active': active });
        }
    } else if (timeRange === '7d') {
        // Daily buckets (last 7 days)
        for (let i = 6; i >= 0; i--) {
            const start = now - (i + 1) * 86400000;
            const end = now - i * 86400000;
            const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
            // For daily active, we count unique users active on that day? 
            // Simplified: users active since that day start.
            const label = new Date(start).toLocaleDateString('en-US', { weekday: 'short' });
            dataPoints.push({ name: label, 'New Users': count });
        }
    } else if (timeRange === '30d') {
         // Daily buckets (last 30 days) - Show every 3rd day label
         for (let i = 29; i >= 0; i--) {
            const start = now - (i + 1) * 86400000;
            const end = now - i * 86400000;
            const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
            const date = new Date(start);
            const label = date.getDate().toString();
            dataPoints.push({ name: label, 'New Users': count });
        }
    } else {
        // Monthly buckets (Last 12 months)
        for (let i = 11; i >= 0; i--) {
             const d = new Date();
             d.setMonth(d.getMonth() - i);
             d.setDate(1);
             d.setHours(0,0,0,0);
             const start = d.getTime();
             
             const nextM = new Date(d);
             nextM.setMonth(nextM.getMonth() + 1);
             const end = nextM.getTime();

             const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
             const label = d.toLocaleDateString('en-US', { month: 'short' });
             dataPoints.push({ name: label, 'New Users': count });
        }
    }

    return dataPoints;
  }, [users, timeRange]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div className="flex h-[80vh] w-full justify-center items-center text-pink-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-pink-600" size={32} />
            Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Welcome back, Admin. Here's what's happening today.
          </p>
        </div>

        {/* Time Filter */}
        <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 shadow-sm">
            {(['24h', '7d', '30d', 'all'] as const).map((t) => (
                <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                        timeRange === t 
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md" 
                            : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
            title="Total Users" 
            value={stats.total} 
            icon={Users} 
            trend="+12%" // Simulated
            trendUp={true}
            color="blue"
        />
        <StatsCard 
            title="Active Users (24h)" 
            value={stats.active} 
            icon={Activity} 
            trend="+5%"
            trendUp={true}
            color="green"
        />
        <StatsCard 
            title="New Users" 
            value={stats.new} 
            subtitle={`In last ${timeRange}`}
            icon={TrendingUp} 
            trend={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`}
            trendUp={stats.growth >= 0}
            color="orange"
        />
        <StatsCard 
            title="Retention Rate" 
            value={stats.total > 0 ? Math.round((stats.active/stats.total)*100) + '%' : '0%'} 
            icon={Clock} 
            trend="-2%"
            trendUp={false}
            color="purple"
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Growth Chart */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">User Growth</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">New user registrations over time</p>
                </div>
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold">
                    <TrendingUp size={14} />
                    <span>On track</span>
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 12 }} 
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="New Users" 
                            stroke="#ec4899" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

        {/* Activity Bar Chart (Simulated distribution) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm flex flex-col"
        >
            <div className="mb-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Activity</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">User engagement distribution</p>
            </div>
            
            <div className="flex-1 min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                        <Tooltip 
                             cursor={{fill: 'transparent'}}
                             contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                        />
                        <Bar dataKey="New Users" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Peak Hour</span>
                    <span className="font-bold text-zinc-900 dark:text-white">8:00 PM</span>
                </div>
            </div>
        </motion.div>
      </div>

      {/* Recent Users Table */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm"
      >
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Users</h3>
            <button className="text-sm font-bold text-pink-600 hover:text-pink-500 transition-colors">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                        <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                        <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Joined</th>
                        <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Activity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {users.slice(0, 5).map((u) => {
                        const isActive = u.lastActive && (Date.now() - u.lastActive) < 86400000;
                        return (
                            <tr key={u.uid} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full bg-zinc-200 object-cover" />
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white">{u.fullName}</p>
                                            <p className="text-xs text-zinc-500">@{u.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                        isActive 
                                            ? "bg-green-500/10 text-green-600 border-green-500/20" 
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                    )}>
                                        {isActive ? 'Online' : 'Offline'}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-4 text-right">
                                     <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                        <ArrowUpRight size={18} />
                                     </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </motion.div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, subtitle, color }: any) => {
    const colorStyles = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        green: 'bg-green-500/10 text-green-600 dark:text-green-400',
        orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }[color as string] || 'bg-zinc-100 text-zinc-900';

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm relative overflow-hidden group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorStyles} transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                        {trend}
                    </div>
                )}
            </div>
            
            <div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mt-1 flex items-center gap-2">
                    {title}
                    {subtitle && <span className="text-[10px] font-normal opacity-70">({subtitle})</span>}
                </p>
            </div>
        </motion.div>
    );
}

export default Admin;