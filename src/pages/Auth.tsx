import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Bus, User, Car, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Validation schemas
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters');

type AuthMode = 'login' | 'register';
type UserRole = 'commuter' | 'driver';

const Auth = () => {
  const location = useLocation();
  const requiredRole = location.state?.requiredRole as UserRole | undefined;

  const [mode, setMode] = useState<AuthMode>(requiredRole ? 'register' : 'login');
  const [role, setRole] = useState<UserRole>(requiredRole || 'commuter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shirtColor, setShirtColor] = useState('');
  const [trouserColor, setTrouserColor] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, always go straight to dashboard
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // While auth is still initialising, show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already logged in — redirect handled above, render nothing in the meantime
  if (user) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    // Validate name for registration
    if (mode === 'register') {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Login failed',
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
          });
        } else {
          toast({
            title: 'Welcome',
            description: 'You have successfully logged in.',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(
          email,
          password,
          name,
          role,
          role === 'commuter' ? { shirtColor, trouserColor } : undefined
        );
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Registration failed',
              description: 'This email is already registered. Please login instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Registration failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Welcome to TRANSIT!',
            description: 'Your account has been created successfully.',
          });
          navigate('/dashboard');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
            <Bus className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TRANSIT</h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'login' ? 'Welcome' : 'Join the smart commute revolution'}
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          layout
          className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          {/* Mode Toggle */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                mode === 'login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
              {mode === 'login' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                mode === 'register' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
              {mode === 'register' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <AnimatePresence mode="wait">
              {/* Role Selection for Registration */}
              {mode === 'register' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <Label className="text-sm font-medium">I am a</Label>
                  <div className={`grid gap-3 ${requiredRole ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {(!requiredRole || requiredRole === 'commuter') && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole('commuter')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          role === 'commuter'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <User className="h-6 w-6" />
                        <span className="font-medium">Commuter</span>
                      </motion.button>
                    )}
                    {(!requiredRole || requiredRole === 'driver') && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole('driver')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          role === 'driver'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Car className="h-6 w-6" />
                        <span className="font-medium">Driver</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Name Field for Registration */}
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className={`transition-all ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`transition-all ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pr-10 transition-all ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {mode === 'register' && !errors.password && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* Appearance Details for Commuter Registration */}
            <AnimatePresence mode="wait">
              {mode === 'register' && role === 'commuter' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div className="rounded-lg bg-muted/50 p-4 border border-border">
                    <p className="text-sm font-medium mb-3">Appearance Details (helps drivers identify you)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="shirtColor" className="text-xs">Shirt Color</Label>
                        <Input
                          id="shirtColor"
                          type="text"
                          value={shirtColor}
                          onChange={(e) => setShirtColor(e.target.value)}
                          placeholder="e.g., Blue"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trouserColor" className="text-xs">Trouser Color</Label>
                        <Input
                          id="trouserColor"
                          type="text"
                          value={trouserColor}
                          onChange={(e) => setTrouserColor(e.target.value)}
                          placeholder="e.g., Black"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium relative overflow-hidden group"
              disabled={isSubmitting}
            >
              <motion.span
                className="flex items-center justify-center gap-2"
                animate={{ x: isSubmitting ? -20 : 0 }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.span>
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p 
          className="text-center text-sm text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          By continuing, you agree to TRANSIT's Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
