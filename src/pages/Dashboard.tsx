import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Bus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CommuterDashboard from '@/components/CommuterDashboard';
import DriverDashboard from '@/components/DriverDashboard';
import { Button } from '@/components/ui/button';
import GlobalNav from '@/components/GlobalNav';

const Dashboard = () => {
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [roleTimeout, setRoleTimeout] = useState(false);
  // Prevent redirect until auth has settled at least once
  const authSettledRef = useRef(false);

  useEffect(() => {
    console.log('[Dashboard]', {
      userId: user?.id,
      role,
      loading,
      hasProfile: !!profile,
    });
  }, [user, role, loading, profile]);

  // Mark auth as settled the first time loading becomes false
  useEffect(() => {
    if (!loading) {
      authSettledRef.current = true;
    }
  }, [loading]);

  // Only redirect unauthenticated users AFTER auth has fully settled.
  // This prevents the hard-refresh race where loading briefly becomes false
  // before getSession() restores the user from localStorage.
  useEffect(() => {
    if (!loading && authSettledRef.current && !user) {
      console.log('[Dashboard] No session after auth settled → redirect home');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Safety: if we somehow still have no role after loading finishes, wait then recover.
  useEffect(() => {
    if (!loading && user && !role) {
      const timer = setTimeout(() => setRoleTimeout(true), 8000);
      return () => clearTimeout(timer);
    }
    if (role) setRoleTimeout(false);
  }, [loading, user, role]);

  useEffect(() => {
    if (roleTimeout && !role) {
      console.warn('[Dashboard] role never resolved, redirecting to /auth');
      navigate('/auth', { replace: true });
    }
  }, [roleTimeout, role, navigate]);

  // Keep showing the loader until auth is done OR we have a user.
  // Never flash the empty state during hard-refresh session restore.
  if (loading || (!user && !authSettledRef.current)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center"
        >
          <Bus className="h-8 w-8 text-primary-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="h-screen w-screen relative overflow-hidden bg-background"
      style={{ height: '100dvh' }}
    >
      <motion.header
        className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-background/90 via-background/50 to-transparent z-40 pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary shadow-lg flex items-center justify-center">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold truncate max-w-[120px]">
                {profile?.name || 'User'}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {role || 'Loading...'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.main
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {role === 'commuter' && <CommuterDashboard />}
        {role === 'driver' && <DriverDashboard />}
        {!role && (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground font-medium">
                Preparing your dashboard...
              </span>
            </div>
          </div>
        )}
      </motion.main>

      <div className="relative z-50 pointer-events-auto">
        <GlobalNav />
      </div>
    </div>
  );
};

export default Dashboard;
