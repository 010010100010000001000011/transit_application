import React from 'react';
import { motion } from 'framer-motion';
import { Map, User, Settings, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export type TabType = 'map' | 'profile' | 'settings';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  showOnlineToggle?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  isOnline = false,
  onToggleOnline,
  showOnlineToggle = false,
}) => {
  const { role } = useAuth();

  const tabs = [
    { id: 'map' as TabType, icon: Map, label: 'Map' },
    { id: 'profile' as TabType, icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border px-4 pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('h-5 w-5 relative z-10', isActive && 'scale-110')} />
              <span className="text-xs font-medium relative z-10">{tab.label}</span>
            </button>
          );
        })}

        {/* Online/Offline toggle for drivers */}
        {showOnlineToggle && onToggleOnline && (
          <button
            onClick={onToggleOnline}
            className={cn(
              'relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200',
              isOnline 
                ? 'text-status-available' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isOnline && (
              <motion.div
                className="absolute inset-0 bg-status-available/10 rounded-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            )}
            {isOnline ? (
              <Power className="h-5 w-5 relative z-10" />
            ) : (
              <PowerOff className="h-5 w-5 relative z-10" />
            )}
            <span className="text-xs font-medium relative z-10">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {isOnline && (
              <motion.div
                className="absolute top-1 right-4 h-2 w-2 bg-status-available rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </button>
        )}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
