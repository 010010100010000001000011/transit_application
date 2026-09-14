import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <motion.header
      className="flex items-center justify-between px-4 py-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-md">
          <Bus size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            TRANSIT
          </h1>
          <p className="text-xs text-muted-foreground">Zambia Transport</p>
        </div>
      </div>

      {/* Menu button */}
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground shadow-md border border-border transition-colors hover:bg-muted"
      >
        <Menu size={20} />
      </button>
    </motion.header>
  );
};

export default Header;
