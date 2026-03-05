'use client';

import { logger } from '@/utils/logger';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface SimpleUser {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

interface SimpleAuthContextType {
  user: SimpleUser | null;
  loading: boolean;
  cachedUserName: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | null>(null);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cachedUserName, setCachedUserName] = useState<string | null>(null);

  useEffect(() => {
    logger.log('🔍 SimpleAuthContext useEffect triggered');
    
    const initializeAuth = async () => {
      // Check for stored user on app load
      const storedUser = localStorage.getItem('current_user');
      const storedUserName = localStorage.getItem('user_name');
      logger.log('🔍 Stored user from localStorage:', storedUser);
      logger.log('🔍 Stored user name from localStorage:', storedUserName);
      
      // Set cached user name immediately if available
      if (storedUserName) {
        setCachedUserName(storedUserName);
      }
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          logger.log('🔍 Parsed user data:', userData);
          
          // Check if Supabase session exists
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            logger.log('✅ Supabase session found, user is authenticated');
            setUser(userData);
            if (userData.name) {
              setCachedUserName(userData.name);
              localStorage.setItem('user_name', userData.name);
            }
          } else {
            logger.log('❌ No Supabase session found, clearing stored user');
            localStorage.removeItem('current_user');
          }
        } catch (error) {
          logger.error('Error parsing stored user:', error);
          localStorage.removeItem('current_user');
        }
      }
      
      logger.log('🔍 Setting auth loading to false');
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) return false;

      // Fetch profile for name and user_type
      let name = data.user.user_metadata?.name as string | undefined;
      let user_type = 'trainer';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileQuery = supabase
        .from('user_profiles')
        .select('name, first_name, last_name, user_type')
        .eq('id', data.user.id)
        .single() as any;
      const { data: profile } = await profileQuery as { data: { name?: string; first_name?: string; last_name?: string; user_type?: string } | null; error: unknown };
      if (profile) {
        name = profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`.trim()
          : profile.name || name;
        user_type = profile.user_type || 'trainer';
      }

      const userData = { id: data.user.id, email: data.user.email!, name, user_type };
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      if (name) { setCachedUserName(name); localStorage.setItem('user_name', name); }
      return true;
    } catch (error) {
      logger.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    // Clear Supabase session
    await supabase.auth.signOut();
    
    setUser(null);
    setCachedUserName(null);
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_name');
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('supabase_user');
    window.location.href = '/dashboard-login';
  };

  return (
    <SimpleAuthContext.Provider value={{ user, loading, cachedUserName, login, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}