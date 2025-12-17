import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAdminStats } from '../services/db';
import { LayoutDashboard, User, MessageSquare, Activity, Loader2 } from '../components/Icons';
import { motion } from 'framer-motion';

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalQuestions: 0,
    totalAnswers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load admin stats", e);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-pink-500" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <LayoutDashboard className="text-pink-500" size={32} />
          Admin Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">Platform overview and analytics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={User} 
          label="Total Users" 
          value={stats.totalUsers} 
          color="text-blue-500" 
          bg="bg-blue-500/10"
        />
        <StatCard 
          icon={Activity} 
          label="Active (7d)" 
          value={stats.activeUsers} 
          color="text-green-500" 
          bg="bg-green-500/10"
        />
        <StatCard 
          icon={MessageSquare} 
          label="Questions Sent" 
          value={stats.totalQuestions} 
          color="text-orange-500" 
          bg="bg-orange-500/10"
        />
        <StatCard 
          icon={MessageSquare} 
          label="Answers Published" 
          value={stats.totalAnswers} 
          color="text-pink-500" 
          bg="bg-pink-500/10"
        />
      </div>

      <div className="glass-card p-6 rounded-3xl mt-8">
        <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
        <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 font-medium">Database Connection</span>
                <span className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1 rounded-full">ONLINE</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 font-medium">Cloud Functions</span>
                <span className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1 rounded-full">OPERATIONAL</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[24px] flex flex-col justify-between h-32"
  >
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-2`}>
      <Icon size={20} />
    </div>
    <div>
      <h3 className="text-3xl font-black text-white">{value}</h3>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

export default Admin;