import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-6 py-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-anime-primary to-anime-secondary text-white shadow-lg shadow-anime-primary/30 hover:shadow-anime-primary/50 hover:-translate-y-0.5",
    secondary: "bg-anime-surface border border-anime-accent/30 text-anime-accent hover:bg-anime-accent/10",
    ghost: "bg-transparent text-slate-400 hover:text-white"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-anime-surface/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-4">
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-anime-primary/30 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-anime-primary rounded-full animate-spin"></div>
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-anime-accent/20 text-anime-accent border border-anime-accent/30">
    {children}
  </span>
);
