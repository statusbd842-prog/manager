import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, X, Users, BookOpenCheck, Search, BadgeIndianRupee } from "lucide-react";

interface FabProps {
  onSearchClick: () => void;
}

const fabItems = [
  { label: "Search Student", icon: Search, action: "search", color: "bg-violet-500" },
  { label: "Attendance", icon: Users, href: "/attendance", color: "bg-indigo-500" },
  { label: "Homework", icon: BookOpenCheck, href: "/homework", color: "bg-blue-500" },
  { label: "Fee Entry", icon: BadgeIndianRupee, href: "/fees", color: "bg-emerald-500" },
];

export function Fab({ onSearchClick }: FabProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleAction = (item: typeof fabItems[number]) => {
    setOpen(false);
    if (item.action === "search") {
      onSearchClick();
    } else if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
      <div className={`flex flex-col items-end gap-2 transition-all duration-200 ${
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        {fabItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleAction(item)}
              className="flex items-center gap-2.5 group"
            >
              <span className="text-xs font-medium bg-white/90 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-full shadow-md border border-white/60 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                {item.label}
              </span>
              <div className={`w-11 h-11 ${item.color} rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-95 ${
          open ? "bg-slate-700 rotate-45" : "bg-indigo-600"
        }`}
        aria-label="Quick actions"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
}
