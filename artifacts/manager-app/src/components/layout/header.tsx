import { Link, useLocation } from "wouter";
import { ChevronLeft, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onSearchClick?: () => void;
}

export function Header({ title, showBack, onSearchClick }: HeaderProps) {
  const { session, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-40 glass-nav border-b">
      <div className="flex items-center h-14 px-4 max-w-md mx-auto relative">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 text-slate-500 hover:text-slate-800 hover:bg-white/60 -ml-2"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        ) : null}

        <div className="flex-1 flex justify-center items-center">
          {title ? (
            <h1 className="text-base font-semibold tracking-tight text-slate-800">{title}</h1>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <span className="font-brand font-bold text-lg text-white leading-none mt-0.5">M</span>
              </div>
              <span className="font-brand font-bold text-xl tracking-tight text-slate-800 mt-0.5">Manager</span>
            </Link>
          )}
        </div>

        <div className="absolute right-2 flex items-center gap-1">
          {session && onSearchClick && (
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-700 hover:bg-white/60"
              onClick={onSearchClick}
              title="Search students"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          {session && !showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-700 hover:bg-white/60"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
