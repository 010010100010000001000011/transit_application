import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, MapPin } from 'lucide-react';

interface StatusBarProps {
  vehiclesAvailable?: number;
  seatsOpen?: number;
  region?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  vehiclesAvailable = 0,
  seatsOpen = 0,
  region = 'RN',
}) => {
  const statVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex gap-3 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md border border-slate-700/50 p-4 shadow-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Vehicles Stat */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 p-3 hover:border-emerald-500/60 transition-colors"
        variants={statVariants}
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/40 text-emerald-300 mb-1">
          <Zap size={16} />
        </div>
        <p className="text-xs font-medium text-slate-300">Vehicles</p>
        <p className="text-xl font-bold text-emerald-300">{vehiclesAvailable}</p>
        <p className="text-xs text-slate-400">available</p>
      </motion.div>

      {/* Seats Stat */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 p-3 hover:border-amber-500/60 transition-colors"
        variants={statVariants}
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/40 text-amber-300 mb-1">
          <Users size={16} />
        </div>
        <p className="text-xs font-medium text-slate-300">Seats</p>
        <p className="text-xl font-bold text-amber-300">{seatsOpen}</p>
        <p className="text-xs text-slate-400">open</p>
      </motion.div>

      {/* Region Stat */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-3 hover:border-blue-500/60 transition-colors"
        variants={statVariants}
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/40 text-blue-300 mb-1">
          <MapPin size={16} />
        </div>
        <p className="text-xs font-medium text-slate-300">Zone</p>
        <p className="text-lg font-bold text-blue-300">{region}</p>
        <p className="text-xs text-slate-400">active</p>
      </motion.div>
    </motion.div>
  );
};

export default StatusBar;
