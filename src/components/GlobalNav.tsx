import React from 'react';
import { motion } from 'framer-motion';
import { Home, Info, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Info, label: 'About', path: '/about' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const GlobalNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`p-2 rounded-xl ${isActive ? 'bg-primary/10' : ''}`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default GlobalNav;
