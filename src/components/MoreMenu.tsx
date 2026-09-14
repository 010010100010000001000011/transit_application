import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Home, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MenuItemType {
  icon: React.ElementType;
  label: string;
  path: string;
}

const menuItems: MenuItemType[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Info, label: 'About', path: '/about' },
];

export const MoreMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* More button - Creative circle */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg hover:shadow-xl flex items-center justify-center group transition-all duration-300 hover:scale-105"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center"
        >
          <MoreVertical className="w-6 h-6 text-primary-foreground" />
        </motion.div>

        {/* Label "more" */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-6 text-xs font-semibold text-foreground whitespace-nowrap"
          pointerEvents="none"
        >
          more
        </motion.span>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-full mt-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-[1000] min-w-[160px]"
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors group relative"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                  
                  {/* Hover indicator line */}
                  <motion.div
                    className="absolute right-0 top-0 bottom-0 w-1 bg-primary"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoreMenu;
