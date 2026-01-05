import { Link } from 'react-router-dom';
import { UserBalance } from '@/components/UserBalance';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-intense border-b border-border/30 animate-fade-in">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 touch-active">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <img 
              src="/adnexus-logo.png" 
              alt="ADNEXUS logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gradient-neon truncate">ADNEXUS</h1>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest hidden xs:block">Watch Ads. Unlock Content.</p>
          </div>
        </Link>
        
        <UserBalance />
      </div>
    </header>
  );
}
