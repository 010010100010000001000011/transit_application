import React from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '@/types/transit';
import { Users, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleToggleProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleToggle: React.FC<RoleToggleProps> = ({ role, onRoleChange }) => {
  return (
    <div className="flex rounded-2xl bg-card/95 backdrop-blur-md p-1.5 shadow-xl border border-border">
      <motion.button
        className={cn(
          'relative flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors',
          role === 'commuter'
            ? 'text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onRoleChange('commuter')}
        whileTap={{ scale: 0.98 }}
      >
        {role === 'commuter' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-primary shadow-md"
            layoutId="roleBackground"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Users size={18} />
          Commuter
        </span>
      </motion.button>

      <motion.button
        className={cn(
          'relative flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors',
          role === 'driver'
            ? 'text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onRoleChange('driver')}
        whileTap={{ scale: 0.98 }}
      >
        {role === 'driver' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-primary shadow-md"
            layoutId="roleBackground"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Car size={18} />
          Driver
        </span>
      </motion.button>
    </div>
  );
};

export default RoleToggle;
