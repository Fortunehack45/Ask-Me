import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile, 
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { createUserProfile, getUserProfile, isUsernameTaken, getEmailByUsername } from '../services/db';
import { Loader2, Shield, Eye, EyeOff, Sparkles, Check } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface InputGroupProps {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  prefix?: string;
  toggleVisible?: () => void;
  isVisible?: boolean;
}

const Auth: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const existingProfile = await getUserProfile(user.uid);
      if (existingProfile) {
        await refreshProfile();
        navigate('/');
      } else {
        setGoogleUser(user as User);
        setFullName(user.displayName || '');
        setEmail(user.email || '');
        setIsCompletingProfile(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) throw new Error("Username too short");
      const taken = await isUsernameTaken(cleanUsername);
      if (taken) throw new Error("Username already taken");
      await createUserProfile({
        uid: googleUser.uid,
        email: googleUser.email!,
        username: cleanUsername,
        fullName,
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
        createdAt: Date.now(),
        bio: "Digital Creator"
      });
      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (view === 'login') {
        let targetEmail = loginInput.trim();
        if (!targetEmail.includes('@')) {
           const fetchedEmail = await getEmailByUsername(targetEmail.toLowerCase());
           if (!fetchedEmail) throw new Error("Portal user not found");
           targetEmail = fetchedEmail;
        }
        await signInWithEmailAndPassword(auth, targetEmail, password);
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        alert("Reset link sent!");
        setView('login');
      } else {
        const cleanUsername = username.trim().toLowerCase();
        const taken = await isUsernameTaken(cleanUsername);
        if (taken) throw new Error("Username taken");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await createUserProfile({
          uid: cred.user.uid,
          email: cred.user.email!,
          username: cleanUsername,
          fullName,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
          createdAt: Date.now(),
          bio: "Studio Guest"
        });
      }
      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-[50px] p-12 md:p-16 rounded-[64px] shadow-[0_48px_100px_rgba(0,0,0,0.2)] border border-white/20 dark:border-white/5 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl mx-auto mb-8 flex items-center justify-center font-black text-white text-4xl shadow-2xl shadow-pink-500/30"
          >
            A
          </motion.div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-3 leading-none">
            {isCompletingProfile ? 'Final Touch' : view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Join Studio' : 'Reset Key'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-lg tracking-tight px-4">
            {isCompletingProfile ? 'Complete your unique identity.' : 'Experience anonymous whispers in high-fidelity.'}
          </p>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-red-500/10 text-red-500 p-5 rounded-[24px] mb-8 text-sm font-black flex items-center gap-3 border border-red-500/10"
            >
              <Shield size={20} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={isCompletingProfile ? handleCompleteProfile : handleAuth} className="space-y-6">
          {!isCompletingProfile ? (
            <>
              {view === 'signup' && (
                <>
                  <InputGroup label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Adebayo Fortune" />
                  <InputGroup label="Username" type="text" value={username} onChange={v => setUsername(v.toLowerCase())} placeholder="user" prefix="@" />
                  <InputGroup label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" />
                </>
              )}
              {view === 'login' && <InputGroup label="Username or Email" type="text" value={loginInput} onChange={setLoginInput} placeholder="username / email" />}
              {view === 'forgot' && <InputGroup label="Email Address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />}
              {view !== 'forgot' && (
                <InputGroup 
                  label="Password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={setPassword} 
                  placeholder="••••••••" 
                  toggleVisible={() => setShowPassword(!showPassword)} 
                  isVisible={showPassword} 
                />
              )}
            </>
          ) : (
            <InputGroup label="Identity (@)" type="text" value={username} onChange={v => setUsername(v.toLowerCase())} placeholder="username" prefix="@" />
          )}
          
          <button type="submit" disabled={loading} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-6 rounded-[28px] flex justify-center items-center gap-4 transition-all shadow-[0_24px_48px_rgba(236,72,153,0.3)] active:scale-95 disabled:opacity-50 text-xl">
            {loading ? <Loader2 className="animate-spin" size={28} /> : isCompletingProfile ? <Check size={28} strokeWidth={3} /> : <Sparkles size={28} />}
            {isCompletingProfile ? 'Finish Setup' : view === 'login' ? 'Enter Studio' : view === 'signup' ? 'Create Portal' : 'Send Link'}
          </button>
        </form>
        
        {view === 'login' && !isCompletingProfile && (
          <button onClick={() => setView('forgot')} className="w-full text-center mt-8 text-[11px] font-black text-zinc-400 hover:text-pink-500 transition-colors uppercase tracking-[0.4em]">
            Recover Access
          </button>
        )}
        
        {!isCompletingProfile && (
          <>
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-white/5"></span></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">Security Check</span></div>
            </div>

            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 py-5 rounded-[28px] text-zinc-900 dark:text-white font-black flex items-center justify-center gap-4 transition-all shadow-sm border border-zinc-200 dark:border-white/10 active:scale-95 disabled:opacity-50 text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google SSO</span>
            </button>
            
            <p className="text-center mt-12 text-zinc-500 font-bold text-lg">
              {view === 'login' ? "New around here?" : "Part of the studio?"} 
              <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-3 text-pink-500 font-black hover:underline underline-offset-8 decoration-2">
                {view === 'login' ? 'Register' : 'Authenticate'}
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

const InputGroup: React.FC<InputGroupProps> = ({ label, type, value, onChange, placeholder, prefix, toggleVisible, isVisible }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black uppercase text-zinc-400 ml-5 tracking-[0.3em]">{label}</label>
    <div className="relative group">
      {prefix && <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-xl">{prefix}</span>}
      <input 
        type={type} 
        required 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className={clsx(
          "w-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-[32px] py-5 dark:text-white outline-none focus:ring-[12px] focus:ring-pink-500/5 focus:border-pink-500 transition-all font-bold text-lg placeholder:opacity-20",
          prefix ? 'pl-12 pr-6' : 'px-8'
        )}
        placeholder={placeholder} 
      />
      {toggleVisible && (
        <button 
          type="button" 
          onClick={toggleVisible} 
          className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          {isVisible ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>
      )}
    </div>
  </div>
);

export default Auth;