import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, MapPin, Users, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Bus,
    title: "Welcome to TRANSIT",
    subtitle: "Your Zambian Transport Companion",
    description: "Ever waited hours for a minibus that never showed up? Those days are over! TRANSIT connects you with real-time transport in your city.",
    gradient: "from-primary to-primary/80",
    accent: "transit-green",
  },
  {
    icon: MapPin,
    title: "Find Your Ride, Fast",
    subtitle: "Real-Time Vehicle Tracking",
    description: "See exactly where buses and taxis are headed. No more guessing! Pick the perfect ride based on destination, seats available, and how close they are.",
    gradient: "from-secondary to-accent",
    accent: "transit-gold",
  },
  {
    icon: Users,
    title: "Drivers Love Us Too",
    subtitle: "Smart Passenger Matching",
    description: "Drivers can spot passengers heading their way. Less time searching, more time earning. It's a win-win for everyone!",
    gradient: "from-accent to-destructive/80",
    accent: "transit-orange",
  },
  {
    icon: Clock,
    title: "Save Time, Every Day",
    subtitle: "Built for Zambian Streets",
    description: "Whether you're heading to town, the market, or campus — TRANSIT gets you there smarter. Ready to revolutionize your commute?",
    gradient: "from-primary via-secondary to-accent",
    accent: "transit-gold",
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const skipToEnd = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          variant="ghost" 
          onClick={skipToEnd}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip
        </Button>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-col items-center text-center max-w-md"
          >
            {/* Icon with gradient background */}
            <motion.div
              className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-xl`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8, delay: 0.1 }}
            >
              <Icon className="w-14 h-14 text-primary-foreground" />
            </motion.div>

            {/* Sparkle decoration */}
            <motion.div
              className="absolute"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-secondary opacity-50" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg font-medium transit-text-gradient mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {slide.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-base leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={nextSlide}
            className="w-full h-14 text-lg font-semibold rounded-2xl transit-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isLastSlide ? (
              <>
                Get Started
                <Sparkles className="ml-2 w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
