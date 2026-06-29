import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_EMAIL_DOMAIN = '@mohgaon.scada';
const AUTO_LOGOUT_HOURS = 12;
const AUTO_LOGOUT_MS = AUTO_LOGOUT_HOURS * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('loginTimestamp');
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    let logoutTimer: NodeJS.Timeout | null = null;

    const setupLogoutTimer = () => {
      const loginTime = localStorage.getItem('loginTimestamp');
      let remaining = AUTO_LOGOUT_MS;

      if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        if (elapsed >= AUTO_LOGOUT_MS) {
          logout();
          return;
        }
        remaining = AUTO_LOGOUT_MS - elapsed;
      } else {
        localStorage.setItem('loginTimestamp', Date.now().toString());
      }

      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        logout();
      }, remaining);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session?.user;
      setIsAuthenticated(isAuth);
      setLoading(false);
      
      if (isAuth) {
        setupLogoutTimer();
      } else {
        if (logoutTimer) clearTimeout(logoutTimer);
        localStorage.removeItem('loginTimestamp');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuth = !!session?.user;
      setIsAuthenticated(isAuth);
      setLoading(false);
      
      if (isAuth) {
        setupLogoutTimer();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [logout]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    let email = username.includes('@') ? username : `${username}${AUTH_EMAIL_DOMAIN}`;
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // If sign in fails and username doesn't contain '@', try fallback domains for existing db users
    if (error && !username.includes('@')) {
      const fallbacks = ['@burhar.scada', '@beohari.scada'];
      for (const domain of fallbacks) {
        const fallbackEmail = `${username}${domain}`;
        const result = await supabase.auth.signInWithPassword({ email: fallbackEmail, password });
        if (!result.error) {
          error = null;
          break;
        }
      }
    }

    if (!error) {
      localStorage.setItem('loginTimestamp', Date.now().toString());
    }
    return !error;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
