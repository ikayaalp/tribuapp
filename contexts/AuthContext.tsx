import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, authApi } from '../services/api/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    const currentUser = authApi.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    const unsubscribe = authApi.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
