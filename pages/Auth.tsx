
import React, { useState } from 'react';
// Corrected modular auth imports to fix resolution issues with named exports
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile, 
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { createUserProfile, getUserProfile, isUsernameTaken, getEmailByUsername } from '../services/db';
import { Loader2, Shield, Eye, EyeOff } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

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
      if (cleanUsername.length < 3) throw new Error("Username must be at least 3 characters");
      const taken = await isUsernameTaken(cleanUsername);
      if (taken) throw new Error("Username already taken");
      await createUserProfile({
        uid: googleUser.uid,
        email: googleUser.email!,
        username: cleanUsername,
        fullName,
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
        createdAt: Date.now(),
        bio: "Just joined!"
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
           if (!fetchedEmail) throw new Error("User not found");
           targetEmail = fetchedEmail;
        }
        await signInWithEmailAndPassword(auth, targetEmail, password);
      } else if (view === 'forgot') {
        if (!email) throw new Error("Email is required for password reset");
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to your email!");
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
          createdAt: Date.now()
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

  // Completion view for OAuth users without a profile
  if (isCompletingProfile && googleUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-zinc-900/50 p-8 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">Complete Profile</h1>
            <p className="text-zinc-500 mt-2">Pick a unique username to finish setting up your account.</p>
          </div>
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <InputGroup label="Username" type="text" value={username} onChange={v => setUsername(v.toLowerCase())} placeholder="username" prefix="@" />
            <button type="submit" disabled={loading} className="w-full bg-pink-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
              {loading && <Loader2 className="animate-spin" size={20} />}
              Complete Setup
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-zinc-900/50 p-8 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-white text-3xl shadow-lg">A</div>
          <h1 className="text-3xl font-bold dark:text-white">
            {view === 'login' ? 'Welcome back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm flex items-center gap-2"><Shield size={16} />{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
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
          
          <button type="submit" disabled={loading} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={20} />}
            {view === 'login' ? 'Login' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>
        
        {view === 'login' && (
          <button onClick={() => setView('forgot')} className="w-full text-center mt-4 text-xs font-bold text-zinc-400 hover:text-pink-500 transition-colors uppercase tracking-widest">
            Forgot password?
          </button>
        )}
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-bold">Or</span></div>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 py-3 rounded-xl dark:text-white font-bold flex items-center justify-center gap-3 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/02/2x/google_light.png" className="w-4 h-4" alt="G" />
          Continue with Google
        </button>
        
        <p className="text-center mt-8 text-zinc-500 text-sm font-medium">
          {view === 'login' ? "Don't have an account?" : "Already have an account?"} 
          <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-2 text-pink-500 font-black hover:underline">
            {view === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const InputGroup: React.FC<InputGroupProps> = ({ label, type, value, onChange, placeholder, prefix, toggleVisible, isVisible }) => (
  <div>
    <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5 ml-1 tracking-widest">{label}</label>
    <div className="relative group">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{prefix}</span>}
      <input 
        type={type} 
        required 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className={`w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3.5 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all ${prefix ? 'pl-10' : 'px-4'}`} 
        placeholder={placeholder} 
      />
      {toggleVisible && (
        <button 
          type="button" 
          onClick={toggleVisible} 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export default Auth;
