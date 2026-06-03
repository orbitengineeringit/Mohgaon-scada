import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  tagCount: number;
  activeCount: number;
  accentColor: 'primary' | 'accent';
  index: number;
}

const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  description,
  icon: Icon,
  path,
  tagCount,
  activeCount,
  accentColor,
  index,
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={`
        nav-card glass-strong w-full p-6 md:p-8 rounded-2xl text-left
        transition-all duration-500 ease-out group
        opacity-0 animate-fade-in
        hover:scale-[1.02] active:scale-[0.98]
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Subtle gradient background */}
      <div
        className={`
          absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl
          opacity-10 group-hover:opacity-20 transition-opacity duration-500
          ${accentColor === 'primary' ? 'bg-primary' : 'bg-accent'}
        `}
      />

      <div className="relative z-10">
        {/* Icon container */}
        <div
          className={`
            w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6
            transition-all duration-300 group-hover:scale-110
            ${accentColor === 'primary' 
              ? 'bg-primary/10 group-hover:bg-primary/15' 
              : 'bg-accent/10 group-hover:bg-accent/15'
            }
          `}
        >
          <Icon
            className={`
              w-8 h-8 md:w-10 md:h-10 transition-colors duration-300
              ${accentColor === 'primary' ? 'text-primary' : 'text-accent'}
            `}
          />
        </div>

        {/* Title */}
        <h2
          className={`
            text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300
            ${accentColor === 'primary' 
              ? 'text-foreground group-hover:text-primary' 
              : 'text-foreground group-hover:text-accent'
            }
          `}
        >
          {title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-sm md:text-base mb-4">
          {description}
        </p>

        {/* Tag count badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-mono font-medium
              ${accentColor === 'primary' 
                ? 'bg-primary/10 text-primary' 
                : 'bg-accent/10 text-accent'
              }
            `}
          >
            {tagCount} Tags
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-success/10 text-success">
            {activeCount} Active
          </span>
          {activeCount < tagCount && (
            <span className="text-xs text-muted-foreground">
              {tagCount - activeCount} unconfigured
            </span>
          )}
        </div>

        {/* Arrow indicator */}
        <div
          className={`
            absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-300 group-hover:translate-x-1
            ${accentColor === 'primary' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-accent/10 text-accent'
            }
          `}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default NavigationCard;