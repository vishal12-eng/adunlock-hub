import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-intense border-b border-border/30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-neon flex items-center justify-center animate-glow-pulse">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 w-10 h-10 rounded-lg bg-gradient-neon opacity-50 blur-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-neon">ADNEXUS</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Watch Ads. Unlock Content.</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link 
            to="/admin" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
