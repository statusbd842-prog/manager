import { ReactNode, useState } from "react";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";
import { Fab } from "@/components/fab";
import { SearchModal } from "@/components/search-modal";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
}

export function AppLayout({ children, title, showBack, hideNav }: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] app-gradient text-foreground flex flex-col mx-auto max-w-md relative shadow-2xl shadow-indigo-200/40 sm:border-x border-white/70">
      <Header title={title} showBack={showBack} onSearchClick={() => setSearchOpen(true)} />
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
      {!hideNav && <Fab onSearchClick={() => setSearchOpen(true)} />}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
