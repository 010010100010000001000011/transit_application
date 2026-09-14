import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, LogIn, Settings, Shield, HelpCircle, ChevronRight, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import GlobalNav from '@/components/GlobalNav';

const Profile: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: Shield, label: 'Privacy & Security', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
  ];

  if (!user) {
    // Not logged in state
    return (
      <div className="min-h-screen bg-background pb-24">
        <motion.div
          className="px-6 pt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>

          {/* Guest Card */}
          <Card className="transit-shadow-card">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <motion.div
                className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Bus className="h-10 w-10 text-muted-foreground" />
              </motion.div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Welcome, Traveler!
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Sign in to unlock the full TRANSIT experience — track rides, save preferences, and connect with drivers.
              </p>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full max-w-xs h-12 text-base font-semibold rounded-xl transit-gradient-primary"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In or Register
              </Button>
            </CardContent>
          </Card>

          {/* Benefits */}
          <motion.div
            className="mt-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Why create an account?
            </h3>
            
            {[
              "Track buses and taxis in real-time",
              "Share your location for pickup",
              "Save your favorite destinations",
              "Get personalized ride recommendations",
            ].map((benefit, index) => (
              <motion.div
                key={benefit}
                className="flex items-center gap-3 text-foreground"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <GlobalNav />
      </div>
    );
  }

  // Logged in state
  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        className="px-6 pt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Profile Header */}
        <Card className="transit-shadow-card mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{profile?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    {role || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-muted transition-colors"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <Separator className="my-6" />

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="destructive"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-muted-foreground">
            TRANSIT v1.0.0
          </p>
        </motion.div>
      </motion.div>

      <GlobalNav />
    </div>
  );
};

export default Profile;
