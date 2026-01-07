import { Link } from 'react-router-dom';
import { ShoppingBag, Gift } from 'lucide-react';
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
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/shop"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop
            </Link>
            <Link
              to="/rewards"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <Gift className="w-4 h-4" />
              Rewards
            </Link>
          </nav>
          
          {/* Mobile Shop Link */}
          <Link
            to="/shop"
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
          </Link>
          
          <UserBalance />
        </div>
      </div>
    </header>
  );
}
