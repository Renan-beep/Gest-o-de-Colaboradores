import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, userType?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isAdmin: boolean;
  isGerencia: boolean;
  isEncarregado: boolean;
  isManagement: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGerencia, setIsGerencia] = useState(false);
  const [isEncarregado, setIsEncarregado] = useState(false);
  const [isManagement, setIsManagement] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check user role when session changes
        if (session?.user) {
          setTimeout(async () => {
            try {
              console.log('Checking user role for:', session.user.id);
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
              
              console.log('Profile data:', profile, 'Error:', profileError);
              
              const role = profile?.role;
              console.log('User role:', role);
              
              setIsAdmin(role === 'admin');
              setIsGerencia(role === 'gerencia');
              setIsEncarregado(role === 'encarregado');
              setIsManagement(role === 'gerencia' || role === 'encarregado');
            } catch (error) {
              console.error('Error checking user role:', error);
              setIsAdmin(false);
              setIsGerencia(false);
              setIsEncarregado(false);
              setIsManagement(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsGerencia(false);
          setIsEncarregado(false);
          setIsManagement(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string, userType?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          user_type: userType || 'encarregado',
        }
      }
    });

    // Se o usuário foi criado com sucesso, criar o profile com o role correto
    if (data.user && !error) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: data.user.id,
            email: email,
            full_name: fullName || '',
            role: userType || 'encarregado'
          }
        ]);
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsGerencia(false);
      setIsEncarregado(false);
      setIsManagement(false);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isGerencia,
    isEncarregado,
    isManagement,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};