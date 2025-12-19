import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminAnalytics } from '../services/db';
import { UserProfile } from '../types';
import { 
  Activity, Loader2, TrendingUp, Users, ArrowUpRight, Mail, Check, RefreshCcw, PenTool, Image, ExternalLink, Search, Copy, Clock, ShieldCheck
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { copyToClipboard, timeAgo } from '../utils';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, subtitle, color }) => {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-emerald-500 bg-emerald-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    purple: 'text-purple-500 bg-purple-500/10'
  };

  return (
    <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 p-10 rounded-[56px] shadow-sm flex flex-col justify-between group hover:bg-white dark:hover:bg-zinc-900 transition-all duration-500">
      <div className="flex justify-between items-start mb-8">
        <div className={clsx("w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", colors[color])}>
          <Icon size={32} />
        </div>
        {trend && (
          <div className={clsx("px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase", trendUp ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg mb-2">{title}</p>
        <div className="flex items-baseline gap-4">
          <h4 className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</h4>
          {subtitle && <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'broadcast' | 'directory'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gmail Dispatcher State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedBCC, setCopiedBCC] = useState(false);

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
    const active24h = users.filter(u => {
      const ts = typeof u.lastActive === 'number' ? u.lastActive : 0;
      return ts > 0 && (now - ts) < oneDay;
    }).length;
    return { total: users.length, active: active24h, new: users.filter(u => (now - u.createdAt) < oneWeek).length };
  }, [users]);

  const chartData = useMemo(() => {
    const now = Date.now();
    const dataPoints = [];
    for (let i = 6; i >= 0; i--) {
        const start = now - (i + 1) * 86400000;
        const end = now - i * 86400000;
        const count = users.filter(u => u.createdAt >= start && u.createdAt < end).length;
        dataPoints.push({ name: new Date(start).toLocaleDateString('en-US', { weekday: 'short' }), 'New Users': count });
    }
    return dataPoints;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const bccList = useMemo(() => {
    return users.map(u => u.email).filter(Boolean).join(', ');
  }, [users]);

  const handleCopyBCC = async () => {
    const success = await copyToClipboard(bccList);
    if (success) {
      setCopiedBCC(true);
      setTimeout(() => setCopiedBCC(false), 3000);
    }
  };

  const openMailClient = () => {
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div className="flex h-[80vh] w-full justify-center items-center text-pink-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-16 pb-24 w-full animate-in fade-in duration-1000">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
          <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-6 leading-none">
            Admin <span className="text-pink-600">HQ</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-4 font-bold text-2xl opacity-80 leading-relaxed">Platform nexus and global dispatch center.</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-white/5 p-2 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm self-start lg:self-center">
            <button onClick={() => setActiveTab('analytics')} className={clsx("px-10 py-5 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-4", activeTab === 'analytics' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Activity size={24} /> Pulse
            </button>
            <button onClick={() => setActiveTab('directory')} className={clsx("px-10 py-5 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-4", activeTab === 'directory' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Users size={24} /> Directory
            </button>
            <button onClick={() => setActiveTab('broadcast')} className={clsx("px-10 py-5 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-4", activeTab === 'broadcast' ? "bg-pink-500 text-white shadow-2xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Mail size={24} /> Dispatch
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatsCard title="Global Studio Participants" value={stats.total} icon={Users} trend="+18%" trendUp={true} color="blue" />
              <StatsCard title="Active Pulse Activity" value={stats.active} icon={Activity} trend="+12%" trendUp={true} color="green" />
              <StatsCard title="Recent Guest Influx" value={stats.new} subtitle="This Week" icon={TrendingUp} color="orange" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              <div className="xl:col-span-8 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 shadow-sm h-[550px]">
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-12 tracking-tighter">Acquisition Velocity</h3>
                  <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={chartData}>
                          <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 900 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 900 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '24px', padding: '16px' }} />
                          <Area type="monotone" dataKey="New Users" stroke="#ec4899" strokeWidth={6} fill="url(#colorUsers)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>

              <div className="xl:col-span-4 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Recent Entries</h3>
                      <button onClick={() => setActiveTab('directory')} className="text-[12px] font-black text-pink-500 uppercase tracking-[0.3em] hover:underline underline-offset-8">View All</button>
                  </div>
                  <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                      {users.slice(0, 10).map(u => (
                          <div key={u.uid} className="flex items-center gap-6 group">
                              <img src={u.avatar} alt={u.username} className="w-16 h-16 rounded-[24px] object-cover group-hover:scale-110 transition-transform ring-4 ring-zinc-50 dark:ring-white/5 shadow-xl" />
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-zinc-900 dark:text-white truncate text-xl leading-none mb-2 tracking-tight">{u.fullName}</p>
                                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Joined {timeAgo(u.createdAt)}</p>
                              </div>
                          </div>
                      ))}
                      {users.length === 0 && <p className="text-zinc-500 font-bold">No users detected yet.</p>}
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div key="directory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
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
                    {filteredUsers.length} Results
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-white/5">
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">User Profile</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Contact</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Last Pulse</th>
                           <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {filteredUsers.map(u => (
                          <tr key={u.uid} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-6">
                                  <img src={u.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt="" />
                                  <div>
                                    <p className="font-black text-zinc-900 dark:text-white text-2xl tracking-tight leading-none mb-2">{u.fullName}</p>
                                    <p className="text-sm font-black text-pink-500 uppercase tracking-widest">@{u.username}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300">{u.email}</p>
                               {u.premiumStatus && <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-500 text-[9px] font-black uppercase tracking-widest">Premium User</span>}
                            </td>
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-3 text-zinc-400 font-bold">
                                  <Clock size={16} /> {u.lastActive ? timeAgo(u.lastActive as any) : 'Unknown'}
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <span className="text-zinc-400 font-bold">{new Date(u.createdAt).toLocaleDateString()}</span>
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
                      <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Global Dispatch</h2>
                      <p className="text-zinc-500 font-bold text-lg mt-1">Blast whispers to all {users.length} registered guests.</p>
                   </div>
                </div>

                <div className="space-y-10">
                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Recipients (BCC Pipeline)</label>
                      <div className="relative">
                        <textarea 
                          readOnly 
                          value={bccList}
                          className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 text-zinc-400 font-bold text-sm resize-none h-32 no-scrollbar"
                        />
                        <button onClick={handleCopyBCC} className="absolute right-8 bottom-8 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                           {copiedBCC ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} {copiedBCC ? 'Copied' : 'Copy List'}
                        </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Announcement Subject</label>
                      <input 
                        type="text" 
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g. New Portal Features available in the Studio!" 
                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[32px] px-8 py-6 text-zinc-900 dark:text-white font-bold text-xl outline-none focus:border-pink-500 transition-all"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Whisper Content</label>
                      <textarea 
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Craft your global announcement here..." 
                        rows={8}
                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[40px] p-10 text-zinc-900 dark:text-white font-bold text-xl outline-none focus:border-pink-500 transition-all resize-none"
                      />
                   </div>

                   <div className="pt-8 flex flex-col sm:flex-row gap-6">
                      <button 
                        onClick={openMailClient}
                        className="flex-1 bg-pink-500 text-white font-black py-8 rounded-[36px] text-2xl shadow-[0_40px_80px_-20px_rgba(236,72,153,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4"
                      >
                         <ExternalLink size={28} strokeWidth={3} /> Launch Gmail Bridge
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

export default Admin;