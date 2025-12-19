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
    <div className="space-y-10 pb-24 max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-4 leading-none">
            Admin <span className="text-pink-600">Command</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-bold text-lg opacity-80">Platform Nexus & Global Dispatch.</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm self-start">
            <button onClick={() => setActiveTab('analytics')} className={clsx("px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3", activeTab === 'analytics' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Activity size={18} /> Pulse
            </button>
            <button onClick={() => setActiveTab('directory')} className={clsx("px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3", activeTab === 'directory' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Users size={18} /> Directory
            </button>
            <button onClick={() => setActiveTab('broadcast')} className={clsx("px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3", activeTab === 'broadcast' ? "bg-pink-500 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-900")}>
              <Mail size={18} /> Dispatch
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard title="Total Studio Users" value={stats.total} icon={Users} trend="+12%" trendUp={true} color="blue" />
              <StatsCard title="Active Pulse" value={stats.active} icon={Activity} trend="+5%" trendUp={true} color="green" />
              <StatsCard title="Recent Guests" value={stats.new} subtitle="This Week" icon={TrendingUp} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 shadow-sm h-[450px]">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-10 tracking-tight">User Acquisition</h3>
                  <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={chartData}>
                          <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 800 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 800 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '16px' }} />
                          <Area type="monotone" dataKey="New Users" stroke="#ec4899" strokeWidth={4} fill="url(#colorUsers)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>

              {/* RECENT GUESTS WIDGET */}
              <div className="lg:col-span-4 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Guests</h3>
                      <button onClick={() => setActiveTab('directory')} className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline underline-offset-4">Directory</button>
                  </div>
                  <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                      {users.slice(0, 6).map(u => (
                          <div key={u.uid} className="flex items-center gap-5 group">
                              <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform ring-2 ring-zinc-100 dark:ring-white/5 shadow-md" />
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-zinc-900 dark:text-white truncate leading-none mb-1">{u.fullName}</p>
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Joined {timeAgo(u.createdAt)}</p>
                              </div>
                          </div>
                      ))}
                      {users.length === 0 && <p className="text-zinc-500 font-bold italic py-10 text-center">No guests found yet.</p>}
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div key="directory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                      <div>
                          <h2 className="text-3xl font-black dark:text-white tracking-tighter">Guest Directory</h2>
                          <p className="text-zinc-500 font-bold text-sm mt-1">{users.length} verified studio participants.</p>
                      </div>
                      <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                          <input 
                              type="text" 
                              placeholder="Search by name, email, or @username..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[28px] py-5 pl-14 pr-8 outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 font-bold text-lg transition-all shadow-inner"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUsers.map(u => (
                          <div key={u.uid} className="flex items-center gap-5 p-5 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 group hover:border-pink-500/20 transition-all shadow-sm">
                              <img src={u.avatar} alt={u.username} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform border-2 border-zinc-100 dark:border-white/10" />
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-zinc-900 dark:text-white truncate text-lg leading-none mb-1">{u.fullName}</p>
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">@{u.username}</p>
                                  <p className="text-[9px] font-bold text-zinc-500 truncate mt-1">{u.email}</p>
                              </div>
                              <a href={`#/u/${u.username}`} target="_blank" rel="noopener noreferrer" className="p-3 opacity-0 group-hover:opacity-100 transition-all bg-pink-500/10 text-pink-500 rounded-xl"><ArrowUpRight size={20} /></a>
                          </div>
                      ))}
                      {filteredUsers.length === 0 && (
                          <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-white/10">
                              <p className="text-zinc-500 font-black text-xl">No guests match "{searchQuery}"</p>
                          </div>
                      )}
                  </div>
              </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div key="broadcast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* DISPATCH CONTROL */}
            <div className="lg:col-span-7 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 md:p-14 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black dark:text-white tracking-tighter">Gmail Dispatcher</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Send professional emails using your local app.</p>
                    </div>
                    <div className="px-5 py-2.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-500/20">Postal Reach: {users.length}</div>
                </div>

                <div className="space-y-8">
                    {/* BCC Aggregator */}
                    <div className="p-8 bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[32px] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Verified BCC List</span>
                            <button 
                                onClick={handleCopyBCC} 
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    copiedBCC ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-pink-500"
                                )}
                            >
                                {copiedBCC ? <Check size={14} /> : <Copy size={14} />} {copiedBCC ? 'Copied' : 'Copy All Emails'}
                            </button>
                        </div>
                        <div className="text-zinc-500 font-medium text-xs truncate opacity-40 italic">
                            {bccList}
                        </div>
                        <p className="text-[9px] font-bold text-zinc-400">Pro Tip: For massive lists, copy this BCC list and paste it manually into Gmail's "BCC" field.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] ml-6">Email Subject</label>
                        <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter the headline of your broadcast..." className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[28px] px-8 py-5 text-zinc-900 dark:text-white outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 font-bold text-lg transition-all" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-6">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">Message Body</label>
                            <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Gmail handles formatting</span>
                        </div>
                        <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} placeholder="Draft your message content here. You can refine the look and add images directly in Gmail after launching." className="w-full bg-zinc-50 dark:bg-[#070708] border border-zinc-100 dark:border-white/5 rounded-[40px] px-10 py-10 text-zinc-900 dark:text-white outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 font-bold text-lg leading-relaxed resize-none transition-all shadow-inner" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Mail size={20} /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Native Bridge Active</p>
                    </div>
                    <button onClick={openMailClient} className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-black px-12 py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-4 text-lg transition-all active:scale-95">
                        <ExternalLink size={24} /> Launch Gmail Studio
                    </button>
                </div>
            </div>

            {/* STUDIO GUIDELINES */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><RefreshCcw size={120} /></div>
                    <h3 className="text-xl font-black dark:text-white tracking-tighter mb-8 flex items-center gap-3"><Sparkles className="text-pink-500" size={20} /> Postal Workflow</h3>
                    
                    <div className="space-y-8 relative z-10">
                        {[
                          { title: 'Launch Draft', desc: 'Click "Launch Gmail Studio" to open your device\'s native mail app with your user list pre-populated in the BCC field.', icon: ExternalLink, color: 'text-blue-500' },
                          { title: 'Rich Formatting', desc: 'Once in Gmail, use their built-in tools to change fonts, colors, and layouts to match Facebook/Amazon standards.', icon: PenTool, color: 'text-purple-500' },
                          { title: 'No Storage Limits', desc: 'Drag-and-drop high-res images and documents directly into the Gmail window. Gmail hosts them for free.', icon: Image, color: 'text-orange-500' },
                          { title: 'Document Support', desc: 'Attach PDF reports or platform manuals without uploading anything to Firebase. Everything stays in your mail ecosystem.', icon: FileText, color: 'text-green-500' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-5">
                                <div className={`shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center ${item.color}`}><item.icon size={18} /></div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-sm dark:text-white tracking-tight">{item.title}</h4>
                                    <p className="text-xs font-bold text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-950 rounded-[48px] p-10 text-center shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-white border border-white/10 shadow-xl"><Globe size={32} /></div>
                        <h3 className="text-2xl font-black text-white tracking-tighter">Global Reach</h3>
                        <p className="text-white/50 font-bold text-sm leading-relaxed">Broadcast to your community instantly. Gmail ensures the highest delivery rates for your platform's growth.</p>
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
        <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 p-8 rounded-[40px] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center ${colorStyles} transition-transform group-hover:scale-110 shadow-lg`}><Icon size={28} /></div>
                {trend && <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${trendUp ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{trend}</div>}
            </div>
            <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-2">{value}</h3>
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">{title} {subtitle && <span className="opacity-40 ml-1">({subtitle})</span>}</p>
        </div>
    );
};

export default Admin;