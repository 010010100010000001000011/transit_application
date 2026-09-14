import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Users, MapPin, Zap, Heart, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import GlobalNav from '@/components/GlobalNav';

const features = [
  {
    icon: MapPin,
    title: "Real-Time Tracking",
    description: "See exactly where vehicles and commuters are on the map, updated live.",
  },
  {
    icon: Users,
    title: "Smart Matching",
    description: "Drivers find passengers along their route, commuters find the right ride.",
  },
  {
    icon: Zap,
    title: "Save Time",
    description: "No more waiting blindly. Know when your transport is coming.",
  },
  {
    icon: Shield,
    title: "Safe & Trusted",
    description: "Verified drivers and appearance details for safe identification.",
  },
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <motion.div
        className="transit-gradient-primary px-6 pt-12 pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Bus className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">About TRANSIT</h1>
        </motion.div>

        <motion.p
          className="text-primary-foreground/90 text-lg leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Born on the streets of Zambia, TRANSIT is revolutionizing how people move through cities.
        </motion.p>
      </motion.div>

      {/* Story Section */}
      <div className="px-6 -mt-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="transit-shadow-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-semibold text-foreground">Our Story</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We've all been there — standing on a dusty corner, watching vehicle after vehicle 
                pass by, none heading where we need to go. Hours wasted. Frustration building.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Meanwhile, drivers cruise half-empty, searching for passengers they can't find. 
                Fuel wasted. Money lost.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">TRANSIT changes everything.</span> We 
                connect commuters and drivers in real-time, making every journey smarter, 
                faster, and more efficient.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mission */}
        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-secondary" />
            Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To eliminate transport inefficiency in Zambia by creating a seamless bridge 
            between those who need rides and those who provide them — all through the 
            power of real-time technology.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">How It Works</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Card className="h-full hover:transit-shadow-card transition-shadow">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-muted-foreground">
            Made with <Heart className="inline w-4 h-4 text-destructive" /> in Zambia
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 TRANSIT. All rights reserved.
          </p>
        </motion.div>
      </div>

      <GlobalNav />
    </div>
  );
};

export default About;
