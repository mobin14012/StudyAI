import { NavLink } from "react-router-dom";
import { LayoutDashboard, User, BarChart3, BookOpen, Upload, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/materials", label: "Materials", icon: Library },
  { to: "/practice", label: "Practice", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  className?: string;
  onNavClick?: () => void;
}

export function Sidebar({ className, onNavClick }: SidebarProps) {
  return (
    <aside className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground">StudyAI</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
