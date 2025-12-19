import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminAnalytics } from '../services/db';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, Activity, Loader2, TrendingUp, Users, Clock, ArrowUpRight, X, Send, Sparkles, Mail, Check, AlertCircle, RefreshCcw, PenTool, Image, FileText, Globe, Copy, ExternalLink, ChevronRight, Search
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

const Admin: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'broadcast' | 'directory'>('analytics');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
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

  // Search filter for Directory
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Generate the BCC list for the Gmail app
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
    window.location.href = mailtoUrl;
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div className="flex h-[80vh] w-full justify-center items-center text-pink-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-12 pb-24 w-full animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
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

              {/* RECENT GUESTS WIDGET */}
              <div className="xl:col-span-4 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Recent Entries</h3>
                      <button onClick={() => setActiveTab('directory')} className="text-[12px] font-black text-pink-500 uppercase tracking-[0.3em] hover:underline underline-offset-8">View All</button>
                  </div>
                  <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                      {users.slice(0, 8).map(u => (
                          <div key={u.uid} className="flex items-center gap-6 group">
                              <img src={u.avatar} alt={u.username} className="w-16 h-16 rounded-[24px] object-cover group-hover:scale-110 transition-transform ring-4 ring-zinc-50 dark:ring-white/5 shadow-xl" />
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-zinc-900 dark:text-white truncate text-xl leading-none mb-2 tracking-tight">{u.fullName}</p>
                                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Joined {timeAgo(u.createdAt)}</p>
                              </div>
                          </div>
                      ))}
                      {users.length === 0 && <p className="text-zinc-500 font-bold italic py-20 text-center text-xl">Directory is empty.</p>}
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div key="directory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 w-full">
              <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[64px] p-12 md:p-16 shadow-sm">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 mb-16">
                      <div>
                          <h2 className="text-5xl font-black dark:text-white tracking-tighter leading-none mb-3">Studio Directory</h2>
                          <p className="text-zinc-500 font-bold text-2xl tracking-tight">{users.length} verified platform guests.</p>
                      </div>
                      <div className="relative flex-1 max-w-2xl">
                          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400" size={32} />
                          <input 
                              type="text" 
                              placeholder="Search by identity, mail, or studio tag..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[40px] py-8 pl-20 pr-10 outline-none focus:ring-[15px] focus:ring-pink-500/5 focus:border-pink-500 font-black text-2xl transition-all shadow-inner placeholder:opacity-30"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                      {filteredUsers.map(u => (
                          <div key={u.uid} className="flex items-center gap-6 p-8 rounded-[48px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 group hover:border-pink-500/30 hover:shadow-2xl transition-all">
                              <img src={u.avatar} alt={u.username} className="w-20 h-20 rounded-[32px] object-cover group-hover:scale-105 transition-transform border-4 border-zinc-50 dark:border-white/10 shadow-lg" />
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-zinc-900 dark:text-white truncate text-2xl leading-none mb-2 tracking-tight">{u.fullName}</p>
                                  <p className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.3em]">@{u.username}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 truncate mt-3 opacity-60">{u.email}</p>
                              </div>
                              <a href={`#/u/${u.username}`} target="_blank" rel="noopener noreferrer" className="p-4 opacity-0 group-hover:opacity-100 transition-all bg-pink-500/10 text-pink-500 rounded-2xl hover:scale-110 active:scale-90"><ArrowUpRight size={28} /></a>
                          </div>
                      ))}
                      {filteredUsers.length === 0 && (
                          <div className="col-span-full py-48 text-center bg-zinc-50 dark:bg-white/[0.02] rounded-[64px] border-4 border-dashed border-zinc-100 dark:border-white/5">
                              <p className="text-zinc-500 dark:text-zinc-600 font-black text-4xl tracking-tighter">Zero matches for "{searchQuery}"</p>
                          </div>
                      )}
                  </div>
              </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div key="broadcast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 xl:grid-cols-12 gap-12 w-full">
            <div className="xl:col-span-8 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] p-14 md:p-20 shadow-sm space-y-16">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-5xl font-black dark:text-white tracking-tighter leading-none">Studio Dispatch</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-bold mt-4 text-2xl leading-relaxed">Broadcast professional narratives through Gmail.</p>
                    </div>
                    <div className="px-8 py-4 bg-pink-500/10 text-pink-500 rounded-full text-sm font-black uppercase tracking-widest border border-pink-500/20 shadow-lg">Reach: {users.length} Users</div>
                </div>

                <div className="space-y-12">
                    <div className="p-12 bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[48px] space-y-8 shadow-inner">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black uppercase text-zinc-400 tracking-[0.4em]">Global BCC Pipeline</span>
                            <button 
                                onClick={handleCopyBCC} 
                                className={clsx(
                                    "flex items-center gap-3 px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl",
                                    copiedBCC ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-pink-500"
                                )}
                            >
                                {copiedBCC ? <Check size={20} strokeWidth={4} /> : <Copy size={20} />} {copiedBCC ? 'Synchronized' : 'Copy All Emails'}
                            </button>
                        </div>
                        <div className="text-zinc-500 font-medium text-lg truncate opacity-40 italic">
                            {bccList}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.5em] ml-10">Broadcast Headline</label>
                        <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="What's the big news today?" className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[40px] px-10 py-8 text-zinc-900 dark:text-white outline-none focus:ring-[15px] focus:ring-pink-500/5 focus:border-pink-500 font-black text-2xl transition-all shadow-inner" />
                    </div>

                    <div className="space-y-6">
                        <label className="text-sm font-black uppercase text-zinc-400 tracking-[0.5em] ml-10">Studio Narrative</label>
                        <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} placeholder="Draft your professional message. You'll refine the media in Gmail." className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[56px] px-12 py-12 text-zinc-900 dark:text-white outline-none focus:ring-[15px] focus:ring-pink-500/5 focus:border-pink-500 font-black text-2xl leading-[1.3] resize-none transition-all shadow-inner" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-16 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[28px] bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg"><Mail size={32} /></div>
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">Postal Bridge Ready</p>
                    </div>
                    <button onClick={openMailClient} className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-black px-20 py-8 rounded-[40px] shadow-[0_40px_80px_-20px_rgba(236,72,153,0.4)] flex items-center justify-center gap-6 text-3xl transition-all active:scale-95">
                        <ExternalLink size={36} /> Launch Studio
                    </button>
                </div>
            </div>

            <div className="xl:col-span-4 space-y-12">
                <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 rounded-[72px] p-16 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><RefreshCcw size={180} /></div>
                    <h3 className="text-4xl font-black dark:text-white tracking-tighter mb-12 flex items-center gap-6"><Sparkles className="text-pink-500" size={32} /> Rules</h3>
                    
                    <div className="space-y-12 relative z-10">
                        {[
                          { title: 'Launch Draft', desc: 'Pre-populates your native client with the entire BCC list instantly.', icon: ExternalLink, color: 'text-blue-500' },
                          { title: 'Rich Formatting', desc: 'Use Gmail\'s internal layout engine for that premium Amazon look.', icon: PenTool, color: 'text-purple-500' },
                          { title: 'Asset Embedding', desc: 'Drag images directly into the Gmail frame. Zero server costs.', icon: Image, color: 'text-orange-500' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-8">
                                <div className={`shrink-0 w-16 h-16 rounded-[24px] bg-zinc-100 dark:bg-white/5 flex items-center justify-center ${item.color} shadow-lg shadow-black/5`}><item.icon size={28} /></div>
                                <div className="space-y-2">
                                    <h4 className="font-black text-2xl dark:text-white tracking-tight leading-none">{item.title}</h4>
                                    <p className="text-lg font-bold text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, subtitle, color }) => {
    const colorStyles = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        orange: 'bg-orange-500/10 text-orange-500',
        purple: 'bg-purple-500/10 text-purple-500',
    }[color];

    return (
        <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-[60px] border border-zinc-200 dark:border-white/5 p-12 rounded-[64px] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-10">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center ${colorStyles} transition-transform group-hover:scale-110 shadow-xl shadow-black/5`}><Icon size={40} /></div>
                {trend && <div className={`flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full ${trendUp ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{trend}</div>}
            </div>
            <h3 className="text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-4">{value}</h3>
            <p className="text-zinc-500 text-[12px] font-black uppercase tracking-[0.4em] leading-none">{title} {subtitle && <span className="opacity-40 ml-2">({subtitle})</span>}</p>
        </div>
    );
};

export default Admin;