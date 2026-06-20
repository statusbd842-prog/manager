import { Link, useLocation } from "wouter";
import { LayoutDashboard, GraduationCap, Users, BadgeIndianRupee, BookOpenCheck } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: GraduationCap },
    { name: "Attendance", href: "/attendance", icon: Users },
    { name: "Fees", href: "/fees", icon: BadgeIndianRupee },
    { name: "Homework", href: "/homework", icon: BookOpenCheck },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto">
        <div className="glass-nav border-t rounded-t-2xl mx-0">
          <nav className="flex items-center justify-around h-16 px-1">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-14 gap-1 transition-colors ${
                    isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? "bg-indigo-50" : ""}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[9px] font-medium ${isActive ? "text-indigo-600" : ""}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
