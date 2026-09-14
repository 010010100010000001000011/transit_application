import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'commuter' | 'driver' | null;

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  shirt_color?: string;
  trouser_color?: string;
  destination?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'commuter' | 'driver', appearanceDetails?: { shirtColor?: string; trouserColor?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  // Flag to suppress onAuthStateChange overwriting role during signUp
  const signUpInProgressRef = React.useRef(false);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[AuthContext] fetchUserData', { userId });

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('[AuthContext] profile fetch error', { userId, profileError });
      }

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('[AuthContext] role fetch error', { userId, roleError });
      }

      if (roleData) {
        console.log('[AuthContext] roleData', roleData);
        setRole(roleData.role as UserRole);
      } else {
        console.warn('[AuthContext] no roleData found', { userId });
        setRole('commuter');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] initial session', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // If signUp() is currently in progress, it will set role/profile
          // directly after the DB writes — don't race against it here.
          if (signUpInProgressRef.current) return;

          setLoading(true);
          await fetchUserData(session.user.id);
          setLoading(false);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    userRole: 'commuter' | 'driver',
    appearanceDetails?: { shirtColor?: string; trouserColor?: string }
  ) => {
    // Block onAuthStateChange from racing against our DB writes
    signUpInProgressRef.current = true;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      signUpInProgressRef.current = false;
      return { error };
    }

    if (data.user) {
      // Write profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        name,
        email,
        shirt_color: appearanceDetails?.shirtColor || null,
        trouser_color: appearanceDetails?.trouserColor || null,
      });

      if (profileError) {
        signUpInProgressRef.current = false;
        return { error: profileError };
      }

      // Write role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: userRole,
      });

      if (roleError) {
        signUpInProgressRef.current = false;
        return { error: roleError };
      }

      // Both rows written — set state directly, no need to re-fetch
      setProfile({
        id: '',
        user_id: data.user.id,
        name,
        email,
        shirt_color: appearanceDetails?.shirtColor,
        trouser_color: appearanceDetails?.trouserColor,
      });
      setRole(userRole);
      setUser(data.user);
      setSession(data.session);
    }

    signUpInProgressRef.current = false;
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
