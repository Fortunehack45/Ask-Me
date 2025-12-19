import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminAnalytics } from '../services/db';
import { UserProfile } from '../types';
import { 
  Activity, Loader2, TrendingUp, Users, ArrowUpRight, Mail, Check, RefreshCcw, Search, Copy, Clock, ShieldCheck, Zap, Calendar, BarChart3, PieChart, Filter, X
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { copyToClipboard, timeAgo } from '../utils';
import clsx from 'clsx';

type TimeRange = '24h' | '7d' | '30d';

const Admin: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'broadcast' | 'directory'>('analytics');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Broadcast State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedBCC, setCopiedBCC] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin) {
        setLoading(true);
        const data = await getAdminAnalytics();
        setUsers(data);
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  // Advanced Analytics Calculations
  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    const new24h = users.filter(u => (now - u.createdAt) < day).length;
    const new7d = users.filter(u => (now - u.createdAt) < week).length;
    const new30d = users.filter(u => (now - u.createdAt) < month).length;

    const active24h = users.filter(u => {
      const ts = typeof u.lastActive === 'number' ? u.lastActive : 0;
      return ts > 0 && (now - ts) < day;
    }).length;

    const premiumCount = users.filter(u => u.premiumStatus).length;

    return { 
      total: users.length, 
      new24h, 
      new7d, 
      new30d, 
      active24h, 
      premiumCount,
      conversionRate: ((premiumCount / (users.length || 1)) * 100).toFixed(1)
    };
  }, [users]);

  // Chart Data Preparation based on selected Range
  const chartData = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const interval = timeRange === '24h' ? (day / 24) : day;
    
    const data = [];
    for (let i = points - 1; i >= 0; i--) {
      const start = now - (i + 1) * interval;
      const end = now - i * interval;
      const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
      
      let label = '';
      const date = new Date(start);
      if (timeRange === '24h') label = `${date.getHours()}:00`;
      else if (timeRange === '7d') label = date.toLocaleDateString('en-US', { weekday: 'short' });
      else label = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;

      data.push({ name: label, signups: count });
    }
    return data;
  }, [users, timeRange]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const bccList = useMemo(() => users.map(u => u.email).filter(Boolean).join(', '), [users]);

  const handleCopyBCC = async () => {
    const success = await copyToClipboard(bccList);
    if (success) {
      setCopiedBCC(true);
      setTimeout(() => setCopiedBCC(false), 3000);
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return (
    <div className="flex flex-col h-[70vh] w-full justify-center items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-20 animate-pulse"></div>
        <Loader2 className="animate-spin text-pink-500 relative" size={64} />
      </div>
      <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-xs">Syncing HQ Data...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-10 border-b border-zinc-100 dark:border-white/5 pb-12">
        <div>
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-pink-500 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-pink-500/30">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">Command Center</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-2xl leading-relaxed">Global status, acquisition metrics, and system broadcasts.</p>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="flex bg-zinc-100 dark:bg-white/5 p-2 rounded-[36px] border border-zinc-200 dark:border-white/10 shadow-sm self-start 2xl:self-center backdrop-blur-3xl">
          {[
            { id: 'analytics', label: 'Analysis', icon: BarChart3 },
            { id: 'directory', label: 'Directory', icon: Users },
            { id: 'broadcast', label: 'Broadcast', icon: Mail },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "px-10 py-5 rounded-[28px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-4 relative",
                activeTab === tab.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-[28px] shadow-2xl" />}
              <tab.icon size={22} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div key="analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
            
            {/* ANALYSIS TOP ROW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatsCard title="Total Guests" value={stats.total} icon={Users} color="blue" subtitle="Lifetime Signups" />
              <StatsCard title="Pulse (24h)" value={stats.active24h} icon={Activity} color="green" trend={`${((stats.active24h / (stats.total || 1)) * 100).toFixed(1)}%`} trendUp={true} subtitle="Active Today" />
              <StatsCard title="Acquisition" value={timeRange === '24h' ? stats.new24h : timeRange === '7d' ? stats.new7d : stats.new30d} icon={TrendingUp} color="pink" subtitle={`New in last ${timeRange}`} />
              <StatsCard title="Conversion" value={`${stats.conversionRate}%`} icon={Zap} color="orange" subtitle="Premium Ratio" />
            </div>

            {/* MAIN CHART SECTION */}
            <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                  <div>
                    <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-4">Acquisition Velocity</h3>
                    <p className="text-zinc-500 font-bold text-lg">Visualizing user growth over time windows.</p>
                  </div>
                  
                  {/* TIME RANGE SELECTOR */}
                  <div className="flex bg-zinc-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-inner">
                    {(['24h', '7d', '30d'] as TimeRange[]).map(r => (
                      <button 
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={clsx(
                          "px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
                          timeRange === r ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xl" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        )}
                      >
                        {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : '30 Days'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '20px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: '#ec4899', fontWeight: 900, fontSize: '14px' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 900, marginBottom: '8px', fontSize: '12px', letterSpacing: '0.1em' }}
                      />
                      <Area type="monotone" dataKey="signups" stroke="#ec4899" strokeWidth={5} fill="url(#colorSignups)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>

            {/* LOWER ANALYSIS DETAIL GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
               {/* PREMIUM DISTRIBUTION */}
               <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 shadow-sm flex flex-col justify-between">
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                      <PieChart className="text-pink-500" size={24} />
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Identity Split</h3>
                    </div>
                    <p className="text-zinc-500 font-bold text-sm">Free vs Premium Studio guests.</p>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="p-8 rounded-[36px] bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Premium Artisans</span>
                           <span className="text-xl font-black text-pink-500">{stats.premiumCount}</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-pink-500 rounded-full" style={{ width: `${stats.conversionRate}%` }} />
                        </div>
                     </div>
                     <div className="p-8 rounded-[36px] bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Free Guests</span>
                           <span className="text-xl font-black text-zinc-900 dark:text-white">{stats.total - stats.premiumCount}</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full" style={{ width: `${100 - parseFloat(stats.conversionRate)}%` }} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* RECENT HIGHLIGHTS */}
               <div className="xl:col-span-2 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-4">
                        <Clock className="text-blue-500" size={24} />
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Recent Entries</h3>
                     </div>
                     <button onClick={() => setActiveTab('directory')} className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:underline underline-offset-8">Explore Full Directory</button>
                  </div>
                  <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    {users.slice(0, 6).map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-6 rounded-[32px] hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-6">
                           <img src={u.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:scale-110 transition-transform" alt="" />
                           <div>
                             <p className="text-xl font-black text-zinc-900 dark:text-white leading-none mb-1 tracking-tight">{u.fullName}</p>
                             <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">@{u.username}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">Joined</p>
                           <p className="text-sm font-bold text-zinc-900 dark:text-white">{timeAgo(u.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div key="directory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
             <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
                  <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
                    <input 
                      type="text" 
                      placeholder="Search global directory..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[40px] pl-20 pr-10 py-6 text-zinc-900 dark:text-white outline-none focus:ring-8 focus:ring-pink-500/5 focus:border-pink-500 transition-all font-bold text-xl"
                    />
                  </div>
                  <div className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-xl">
                    {filteredUsers.length} Guests Listed
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-white/5">
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Identity</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Communication</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Pulse Status</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Creation Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {filteredUsers.map(u => (
                          <tr key={u.uid} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-6">
                                  <img src={u.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-transparent group-hover:border-pink-500 transition-all" alt="" />
                                  <div>
                                    <p className="font-black text-zinc-900 dark:text-white text-2xl tracking-tight leading-none mb-2">{u.fullName}</p>
                                    <p className="text-sm font-black text-pink-500 uppercase tracking-widest">@{u.username}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300">{u.email}</p>
                               {u.premiumStatus && <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-500 text-[9px] font-black uppercase tracking-widest">Premium Level</span>}
                            </td>
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-3 text-zinc-500 font-bold">
                                  {u.lastActive ? (
                                    <div className="flex items-center gap-3">
                                      <div className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", (Date.now() - (typeof u.lastActive === 'number' ? u.lastActive : 0)) < 600000 ? "bg-green-500" : "bg-zinc-400")} />
                                      {timeAgo(u.lastActive as any)}
                                    </div>
                                  ) : 'Never Active'}
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <span className="text-zinc-400 font-bold text-sm tracking-tight">{new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div key="broadcast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto w-full">
             <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 md:p-16 shadow-sm">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-16 h-16 rounded-[24px] bg-pink-500 text-white flex items-center justify-center shadow-2xl shadow-pink-500/30">
                      <Mail size={32} />
                   </div>
                   <div>
                      <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Global Broadcast</h2>
                      <p className="text-zinc-500 font-bold text-lg mt-1">Connect with all {users.length} Studio participants.</p>
                   </div>
                </div>

                <div className="space-y-10">
                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Recipients Pipeline (BCC)</label>
                      <div className="relative">
                        <textarea 
                          readOnly 
                          value={bccList}
                          className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 text-zinc-400 font-bold text-sm resize-none h-32 no-scrollbar"
                        />
                        <button onClick={handleCopyBCC} className="absolute right-8 bottom-8 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                           {copiedBCC ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} {copiedBCC ? 'List Copied' : 'Copy All'}
                        </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Broadcast Subject</label>
                      <input 
                        type="text" 
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g. Identity Modification Update is Live!" 
                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white font-bold text-xl outline-none focus:border-pink-500 transition-all"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Message Content</label>
                      <textarea 
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Craft your high-priority whisper to the entire platform..." 
                        rows={8}
                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[40px] p-10 text-zinc-900 dark:text-white font-bold text-xl outline-none focus:border-pink-500 transition-all resize-none shadow-inner"
                      />
                   </div>

                   <div className="pt-8">
                      <button 
                        onClick={() => window.open(`mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_blank')}
                        className="w-full bg-pink-500 text-white font-black py-8 rounded-[40px] text-2xl shadow-[0_40px_80px_-20px_rgba(236,72,153,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-5"
                      >
                         Launch Gmail Gateway <Zap size={28} />
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  color: 'blue' | 'green' | 'orange' | 'pink';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, subtitle, color }) => {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-500/10 shadow-blue-500/10',
    green: 'text-emerald-500 bg-emerald-500/10 shadow-emerald-500/10',
    orange: 'text-orange-500 bg-orange-500/10 shadow-orange-500/10',
    pink: 'text-pink-500 bg-pink-500/10 shadow-pink-500/10'
  };

  return (
    <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 p-10 rounded-[56px] shadow-sm flex flex-col justify-between group hover:bg-white dark:hover:bg-zinc-900 transition-all duration-500 relative overflow-hidden h-[300px]">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={clsx("w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xl", colorMap[color])}>
          <Icon size={32} />
        </div>
        {trend && (
          <div className={clsx("px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2", trendUp ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>
            <TrendingUp size={12} className={!trendUp ? 'rotate-180' : ''} /> {trend}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">{title}</p>
        <div className="flex items-baseline gap-4">
          <h4 className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</h4>
        </div>
        {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-2 opacity-50">{subtitle}</p>}
      </div>
      <div className={clsx("absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-[80px] opacity-10 pointer-events-none transition-transform group-hover:scale-150 duration-1000", color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-emerald-500' : color === 'orange' ? 'bg-orange-500' : 'bg-pink-500')} />
    </div>
  );
};

export default Admin;