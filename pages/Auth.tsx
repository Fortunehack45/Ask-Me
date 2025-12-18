
import React, { useState } from 'react';
// Consolidating and cleaning up Firebase Auth imports to resolve modular resolution issues
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
import { Loader2, Shield, Eye, EyeOff, Check } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [successMsg, setSuccessMsg] = useState('');
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
        setGoogleUser(user);
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
      if (cleanUsername.length < 3) throw new Error("Min 3 characters");
      const taken = await isUsernameTaken(cleanUsername);
      if (taken) throw new Error("Taken");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-zinc-900/50 p-8 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-white text-3xl">A</div>
          <h1 className="text-3xl font-bold dark:text-white">{view === 'login' ? 'Welcome back' : 'Create Account'}</h1>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm flex items-center gap-2"><Shield size={16} />{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'signup' && (
            <>
              <InputGroup label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Name" />
              <InputGroup label="Username" type="text" value={username} onChange={v => setUsername(v.toLowerCase())} placeholder="user" prefix="@" />
              <InputGroup label="Email" type="email" value={email} onChange={setEmail} placeholder="email" />
            </>
          )}
          {view === 'login' && <InputGroup label="User/Email" type="text" value={loginInput} onChange={setLoginInput} placeholder="id" />}
          
          <InputGroup label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="••••" toggleVisible={() => setShowPassword(!showPassword)} isVisible={showPassword} />
          
          <button type="submit" disabled={loading} className="w-full bg-pink-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
            {loading && <Loader2 className="animate-spin" size={20} />}
            {view === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <button onClick={handleGoogleSignIn} className="w-full mt-4 bg-zinc-100 dark:bg-zinc-800 py-3 rounded-xl dark:text-white font-bold">Google</button>
        
        <p className="text-center mt-6 text-zinc-500 text-sm">
          {view === 'login' ? 'No account?' : 'Joined?'} <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-pink-500 font-bold underline">Click here</button>
        </p>
      </motion.div>
    </div>
  );
};

const InputGroup: React.FC<InputGroupProps> = ({ label, type, value, onChange, placeholder, prefix, toggleVisible, isVisible }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{prefix}</span>}
      <input type={type} required value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3.5 dark:text-white outline-none focus:border-pink-500 ${prefix ? 'pl-10' : 'px-4'}`} placeholder={placeholder} />
      {toggleVisible && <button type="button" onClick={toggleVisible} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">{isVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
    </div>
  </div>
);

export default Auth;
