import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-intense border-b border-border/30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex-shrink-0">
            <img 
              src="/adnexus-logo.png" 
              alt="ADNEXUS logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-neon">ADNEXUS</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Watch Ads. Unlock Content.</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
