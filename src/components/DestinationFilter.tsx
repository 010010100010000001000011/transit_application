import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, ChevronDown } from 'lucide-react';
import { DESTINATIONS } from '@/data/mockData';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface DestinationFilterProps {
  selectedDestination: string | null;
  onDestinationChange: (destination: string | null) => void;
}

export const DestinationFilter: React.FC<DestinationFilterProps> = ({
  selectedDestination,
  onDestinationChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredDestinations = DESTINATIONS.filter((dest) =>
    dest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-sm">
      {/* Trigger button */}
      <Button
        variant="map"
        size="lg"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <MapPin size={18} className="text-secondary" />
          {selectedDestination || 'Filter by destination'}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown content */}
            <motion.div
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-card shadow-xl border border-border"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Search input */}
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Clear filter option */}
              {selectedDestination && (
                <button
                  className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/5"
                  onClick={() => {
                    onDestinationChange(null);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <X size={16} />
                  Clear filter
                </button>
              )}

              {/* Destination list */}
              <div className="max-h-64 overflow-y-auto">
                {filteredDestinations.map((destination) => (
                  <button
                    key={destination}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted',
                      selectedDestination === destination &&
                        'bg-primary/10 text-primary font-medium'
                    )}
                    onClick={() => {
                      onDestinationChange(destination);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <MapPin
                      size={16}
                      className={
                        selectedDestination === destination
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                    {destination}
                  </button>
                ))}

                {filteredDestinations.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No destinations found
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DestinationFilter;
