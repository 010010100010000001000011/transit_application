import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'commuter' | 'driver',
    appearanceDetails?: { shirtColor?: string; trouserColor?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Race a promise against a timeout so we never hang the UI forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const signUpInProgressRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[AuthContext] fetchUserData', { userId });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Never hang more than 4s on profile/role fetches
      const [profileRes, roleRes] = await withTimeout(
        Promise.all([profilePromise, rolePromise]),
        4000,
        [
          { data: null, error: { message: 'timeout' } },
          { data: null, error: { message: 'timeout' } },
        ] as any
      );

      if (profileRes?.error) {
        console.error('[AuthContext] profile fetch error', profileRes.error);
      }
      if (profileRes?.data) {
        setProfile(profileRes.data as Profile);
      }

      if (roleRes?.error) {
        console.error('[AuthContext] role fetch error', roleRes.error);
      }

      if (roleRes?.data?.role) {
        console.log('[AuthContext] roleData', roleRes.data);
        setRole(roleRes.data.role as UserRole);
      } else {
        console.warn('[AuthContext] no role found, defaulting to commuter', { userId });
        setRole('commuter');
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserData unexpected error', error);
      setRole((prev) => prev ?? 'commuter');
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          { data: { session: null } } as any
        );

        console.log('[AuthContext] initial session', {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
        });

        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // CRITICAL: clear loading as soon as we know the session.
        // Do NOT await profile/role — that was causing endless "Loading dashboard...".
        setLoading(false);
        initialLoadDoneRef.current = true;

        // Fetch profile + role in the background
        if (initialSession?.user) {
          fetchUserData(initialSession.user.id).catch(() => {
            setRole((prev) => prev ?? 'commuter');
          });
        }
      } catch (err) {
        console.error('[AuthContext] initializeAuth error', err);
        if (mounted) {
          setLoading(false);
          initialLoadDoneRef.current = true;
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthContext] onAuthStateChange', { event, hasSession: !!newSession });

      if (!mounted) return;

      // Token refresh: silent update, never touch loading
      if (event === 'TOKEN_REFRESHED') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user ?? null);
          if (newSession.user) {
            fetchUserData(newSession.user.id).catch(() => {});
          }
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // INITIAL_SESSION / SIGNED_IN / USER_UPDATED
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        if (signUpInProgressRef.current) return;

        // Only show loader on a true first sign-in before bootstrap finished
        const shouldShowLoading =
          event === 'SIGNED_IN' && !initialLoadDoneRef.current;

        if (shouldShowLoading) setLoading(true);

        // Clear loading immediately once we have a user; fetch data in background
        if (shouldShowLoading) {
          setLoading(false);
        }
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          setLoading(false);
        }

        fetchUserData(newSession.user.id).catch(() => {
          setRole((prev) => prev ?? 'commuter');
        });
      } else if (!initialLoadDoneRef.current) {
        setProfile(null);
        setRole(null);
        setLoading(false);
        initialLoadDoneRef.current = true;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    userRole: 'commuter' | 'driver',
    appearanceDetails?: { shirtColor?: string; trouserColor?: string }
  ) => {
    signUpInProgressRef.current = true;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      signUpInProgressRef.current = false;
      return { error };
    }

    if (data.user) {
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

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: userRole,
      });

      if (roleError) {
        signUpInProgressRef.current = false;
        return { error: roleError };
      }

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
      setLoading(false);
      initialLoadDoneRef.current = true;
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
    setLoading(false);
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
