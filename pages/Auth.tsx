import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile, 
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { createUserProfile, getUserProfile, isUsernameTaken, getEmailByUsername } from '../services/db';
import { Loader2, Shield, Eye, EyeOff, Check } from '../components/Icons';
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
          bio: "Ask Me Guest"
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
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
            className="w-24 h-24 bg-gradient-to-br from-[#ff0080] to-[#ff8c00] rounded-[32px] mx-auto mb-8 flex items-center justify-center font-black text-white text-5xl shadow-2xl shadow-pink-500/30 pt-1 tracking-tighter"
          >
            Am
          </motion.div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-3 leading-none">
            {isCompletingProfile ? 'Final Touch' : view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Join Ask Me' : 'Reset Key'}
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
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : isCompletingProfile ? (
              <Check size={28} strokeWidth={3} />
            ) : null}
            {isCompletingProfile ? 'Complete Setup' : view === 'login' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>
        
        {view === 'login' && !isCompletingProfile && (
          <button onClick={() => setView('forgot')} className="w-full text-center mt-8 text-[11px] font-black text-zinc-400 hover:text-pink-500 transition-colors uppercase tracking-[0.4em]">
            Forgot Password
          </button>
        )}
        
        {!isCompletingProfile && (
          <>
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-white/5"></span></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">Or</span></div>
            </div>

            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 py-5 rounded-[28px] text-zinc-900 dark:text-white font-black flex items-center justify-center gap-4 transition-all shadow-sm border border-zinc-200 dark:border-white/10 active:scale-95 disabled:opacity-50 text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 48 48" shapeRendering="geometricPrecision">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <p className="text-center mt-12 text-zinc-500 font-bold text-lg">
              {view === 'login' ? "New around here?" : "Part of the Ask Me?"} 
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