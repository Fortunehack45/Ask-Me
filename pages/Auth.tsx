import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile, 
  User, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { createUserProfile, getUserProfile, isUsernameTaken, getEmailByUsername } from '../services/db';
import { Loader2, Shield, Eye, EyeOff, Check } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Form States
  // For Login, 'loginInput' can be email OR username
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI States
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
    setError('');

    try {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) throw new Error("Username must be at least 3 characters");
      
      const taken = await isUsernameTaken(cleanUsername);
      if (taken) throw new Error("Username is already taken");

      await createUserProfile({
        uid: googleUser.uid,
        email: googleUser.email!,
        username: cleanUsername,
        fullName,
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
        createdAt: Date.now(),
        bio: "Just joined Ask Me! Ask me anything."
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
        // Determine if input is email or username
        let targetEmail = loginInput.trim();
        const isEmail = targetEmail.includes('@');

        if (!isEmail) {
           const fetchedEmail = await getEmailByUsername(targetEmail.toLowerCase());
           if (!fetchedEmail) {
             throw new Error("Username not found");
           }
           targetEmail = fetchedEmail;
        }

        await signInWithEmailAndPassword(auth, targetEmail, password);
        await refreshProfile();
        navigate('/');

      } else {
        // Sign Up
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) throw new Error("Username must be at least 3 characters");
        
        const taken = await isUsernameTaken(cleanUsername);
        if (taken) throw new Error("Username is already taken");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        await createUserProfile({
          uid: user.uid,
          email: user.email!,
          username: cleanUsername,
          fullName,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}`,
          createdAt: Date.now(),
          bio: "Just joined Ask Me! Ask me anything."
        });

        await refreshProfile();
        navigate('/');
      }
    } catch (err: any) {
      let msg = err.message.replace('Firebase:', '').trim();
      if (msg.includes('user-not-found') || msg.includes('invalid-credential')) msg = "Invalid username or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
       // Allow entering username for password reset too
       let targetEmail = loginInput.trim();
       const isEmail = targetEmail.includes('@');

       if (!isEmail && targetEmail) {
          const fetchedEmail = await getEmailByUsername(targetEmail.toLowerCase());
          if (!fetchedEmail) throw new Error("Username not found");
          targetEmail = fetchedEmail;
       }

       if (!targetEmail) throw new Error("Please enter your email or username");

       await sendPasswordResetEmail(auth, targetEmail);
       setSuccessMsg(`Reset link sent to ${targetEmail}`);
    } catch (err: any) {
       setError(err.message.replace('Firebase:', '').trim());
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden px-6 font-sans bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] mx-auto glass-card rounded-[32px] p-8 md:p-10 relative z-10 shadow-2xl shadow-black/80 ring-1 ring-white/10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-orange-500 rounded-2xl mx-auto mb-6 shadow-[0_10px_30px_-10px_rgba(236,72,153,0.5)] flex items-center justify-center">
             <span className="text-3xl font-black text-white">A</span>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {isCompletingProfile ? 'Almost there' : view === 'login' ? 'Welcome back' : view === 'signup' ? 'Join Ask Me' : 'Reset Password'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
            {isCompletingProfile 
              ? 'Pick a unique username to finish setting up your profile.' 
              : view === 'login'
                ? 'Enter your details to access your account.' 
                : view === 'signup'
                ? 'Create your anonymous profile in seconds.'
                : 'Enter your email or username to receive a reset link.'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-3"
          >
            <Shield size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}

        {successMsg && (
            <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-3"
          >
            <Check size={16} className="shrink-0" />
            {successMsg}
          </motion.div>
        )}

        <AnimatePresence mode='wait'>
          {isCompletingProfile ? (
            <motion.form 
              key="complete"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCompleteProfile} 
              className="space-y-5"
            >
              <InputGroup label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="John Doe" />
              <InputGroup label="Username" type="text" value={username} onChange={(v: string) => setUsername(v.replace(/\s/g, '').toLowerCase())} placeholder="johndoe" prefix="@" />
               <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                Complete Setup
              </button>
              <button 
                type="button" 
                onClick={() => { setIsCompletingProfile(false); setGoogleUser(null); }}
                className="w-full text-zinc-500 text-sm font-semibold hover:text-zinc-900 dark:hover:text-white transition-colors py-2"
              >
                Cancel
              </button>
            </motion.form>
          ) : view === 'forgot' ? (
            <motion.form
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleForgotPassword}
                className="space-y-5"
            >
                <InputGroup 
                    label="Email or Username" 
                    type="text" 
                    value={loginInput} 
                    onChange={setLoginInput} 
                    placeholder="you@example.com or username" 
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    Send Reset Link
                </button>
                <button 
                    type="button" 
                    onClick={() => setView('login')}
                    className="w-full text-zinc-500 text-sm font-semibold hover:text-zinc-900 dark:hover:text-white transition-colors py-2"
                >
                    Back to Login
                </button>
            </motion.form>
          ) : (
            <motion.form 
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleAuth} 
              className="space-y-5"
            >
              {view === 'signup' && (
                <>
                  <InputGroup label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="John Doe" />
                  <InputGroup label="Username" type="text" value={username} onChange={(v: string) => setUsername(v.replace(/\s/g, '').toLowerCase())} placeholder="johndoe" prefix="@" />
                  <InputGroup label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                </>
              )}

              {view === 'login' && (
                 <InputGroup label="Email or Username" type="text" value={loginInput} onChange={setLoginInput} placeholder="you@example.com or username" />
              )}

              <InputGroup 
                label="Password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={setPassword} 
                placeholder="••••••••" 
                toggleVisible={() => setShowPassword(!showPassword)}
                isVisible={showPassword}
              />

              {view === 'login' && (
                  <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')}
                        className="text-xs font-bold text-zinc-500 hover:text-pink-500 transition-colors"
                      >
                          Forgot Password?
                      </button>
                  </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {view === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="my-8 flex items-center gap-4">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 font-bold py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <p className="mt-8 text-center text-zinc-500 text-sm font-medium">
                {view === 'login' ? "New here?" : "Already a member?"}{" "}
                <button 
                  type="button"
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="text-zinc-900 dark:text-white hover:text-pink-500 font-bold underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4 transition-colors"
                >
                  {view === 'login' ? 'Sign up now' : 'Log in'}
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Helper UI Component for consistent Inputs
const InputGroup = ({ label, type, value, onChange, placeholder, prefix, toggleVisible, isVisible }: any) => (
  <div>
    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <div className="relative group">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold group-focus-within:text-pink-500 transition-colors">
          {prefix}
        </span>
      )}
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all font-medium ${prefix ? 'pl-9 pr-4' : 'px-4'}`}
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