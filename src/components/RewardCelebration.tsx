import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

// Generate random confetti particles
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    color: ['bg-primary', 'bg-accent', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400'][
      Math.floor(Math.random() * 5)
    ],
    size: 4 + Math.random() * 6,
  }));
}

export function RewardCelebration({ 
  show, 
  onComplete,
  message = "Content Unlocked!" 
}: RewardCelebrationProps) {
  const [confetti, setConfetti] = useState<ReturnType<typeof generateConfetti>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setConfetti(generateConfetti(30));
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className={cn(
              "absolute rounded-full animate-confetti-fall",
              particle.color
            )}
            style={{
              left: `${particle.x}%`,
              width: particle.size,
              height: particle.size,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
      
      {/* Success content */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-celebrate-pop">
        {/* Glow ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/20 animate-pulse-ring" />
        </div>
        
        {/* Icon container */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-check-bounce shadow-neon-intense">
            <CheckCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          
          {/* Sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-wiggle" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-accent animate-wiggle" style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Message */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {message}
          </h3>
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
            You saved time with your rewards!
          </p>
        </div>
      </div>
    </div>
  );
}