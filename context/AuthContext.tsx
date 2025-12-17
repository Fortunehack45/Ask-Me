import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, updateUserLastActive } from '../services/db';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      
      // Track activity asynchronously (fire and forget)
      // Do not await this, as it blocks the UI rendering unnecessarily
      if (profile) {
        updateUserLastActive(uid);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchProfile(currentUser.uid);
    }
  };

  const isAdmin = user?.email?.toLowerCase() === 'fortunedomination@gmail.com';

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};