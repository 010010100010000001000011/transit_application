import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GlobalNav from '@/components/GlobalNav';
import Onboarding from '@/components/Onboarding';

const ONBOARDING_KEY = 'transit_onboarding_complete';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
    setCheckingOnboarding(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center"
        >
          <Bus className="h-8 w-8 text-primary-foreground" />
        </motion.div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const quickActions = [
    {
      icon: MapPin,
      title: "Find a Ride",
      description: "See nearby vehicles heading your way",
      color: "bg-primary/10 text-primary",
      action: () => user ? navigate('/dashboard') : navigate('/auth', { state: { requiredRole: 'commuter' } }),
    },
    {
      icon: Users,
      title: "Start Driving",
      description: "Pick up passengers along your route",
      color: "bg-secondary/10 text-secondary",
      action: () => user ? navigate('/dashboard') : navigate('/auth', { state: { requiredRole: 'driver' } }),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full" />

        <motion.div
          className="relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl transit-gradient-primary flex items-center justify-center shadow-lg">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold transit-text-gradient">TRANSIT</h1>
              <p className="text-sm text-muted-foreground">Zambia Transport</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground leading-tight mt-6 mb-3">
            Your ride is{' '}
            <span className="transit-text-gradient">just around</span>{' '}
            the corner
          </h2>
          
          <p className="text-muted-foreground text-base">
            Real-time transport tracking for smarter commutes across Zambia.
          </p>
        </motion.div>
      </div>



      {/* Quick Actions */}
      <div className="px-6">
        <motion.h3
          className="text-lg font-semibold text-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Get Started
        </motion.h3>

        <div className="grid gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:transit-shadow-card transition-all duration-300 active:scale-[0.98]"
                  onClick={action.action}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Feature Highlights */}
      <motion.div
        className="px-6 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h3 className="text-lg font-semibold text-foreground">Why TRANSIT?</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { stat: "Real-time", label: "Tracking" },
            { stat: "Smart", label: "Matching" },
            { stat: "Fast", label: "Pickup" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="text-center p-4 rounded-xl bg-card border border-border"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <p className="text-lg font-bold transit-text-gradient">{item.stat}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>



      <GlobalNav />
    </div>
  );
};

export default Home;
