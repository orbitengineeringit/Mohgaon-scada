import React, { useState } from 'react';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PlantAssistant from './PlantAssistant';
import { cn } from '@/lib/utils';

const FloatingAssistantButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide on /assistant page itself
  if (!isAuthenticated || location.pathname === '/assistant') return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Plant Assistant"
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl',
          'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground',
          'flex items-center justify-center transition-all duration-300',
          'hover:scale-110 active:scale-95',
          open && 'rotate-90'
        )}
      >
        {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />}
      </button>

      {/* Popover Panel — fullscreen-ish on mobile, anchored card on desktop */}
      {open && (
        <div
          className={cn(
            'fixed z-50 transition-all duration-300',
            // mobile: take most of the screen above the FAB
            'inset-x-2 bottom-20 top-4',
            // desktop: anchored card
            'sm:inset-auto sm:bottom-24 sm:right-5 sm:top-auto sm:w-[420px]',
            'animate-in slide-in-from-bottom-5 fade-in'
          )}
        >
          <div className="relative h-full">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/assistant');
              }}
              aria-label="Open full page"
              className="absolute -top-2 -left-2 z-10 bg-secondary text-secondary-foreground rounded-full p-1.5 shadow-md hover:scale-110 transition"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <PlantAssistant variant="compact" onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistantButton;
