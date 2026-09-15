import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    console.log('[Dashboard]', {
      userId: user?.id,
      role,
      loading,
      hasProfile: !!profile,
    });
  }, [user, role, loading, profile]);

  // Redirect only after auth finished AND there is truly no user
  useEffect(() => {
    if (!loading && !user) {
      console.log('[Dashboard] No session → redirect home');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // If role is still null after a few seconds, default is already applied in AuthContext;
  // this is only a last-resort redirect if something is deeply broken.
  useEffect(() => {
    if (!loading && user && !role) {
      const timer = setTimeout(() => setRoleTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
    if (role) setRoleTimeout(false);
  }, [loading, user, role]);

  useEffect(() => {
    if (roleTimeout && !role) {
      console.warn('[Dashboard] role never resolved after 10s');
      // Don't redirect — AuthContext defaults to 'commuter'. Just log.
    }
  }, [roleTimeout, role]);

  // Show loader ONLY while the auth session itself is loading.
  // Profile/role load in the background and must not block the UI.
  if (loading) {
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

  // Effective role: never stay on "preparing" forever
  const effectiveRole = role ?? 'commuter';

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
                {effectiveRole}
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
        {effectiveRole === 'driver' ? <DriverDashboard /> : <CommuterDashboard />}
      </motion.main>

      <div className="relative z-50 pointer-events-auto">
        <GlobalNav />
      </div>
    </div>
  );
};

export default Dashboard;
