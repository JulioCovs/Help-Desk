import React, { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import type { AppRole } from "@/auth/roles";

const ALL_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] as AppRole[] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["admin", "manager", "employee"] as AppRole[] },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["admin", "manager"] as AppRole[] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] as AppRole[] },
];

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const navItems = useMemo(() => {
    const role = user?.role ?? "employee";
    return ALL_NAV.filter((item) => item.roles.includes(role));
  }, [user?.role]);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
      <div className="h-20 flex items-center px-8 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <HelpCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground tracking-tight">HelpDesk</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
        <div className="px-4 mb-2 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            )}>
              <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "" : "group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user ? (
          <p className="px-4 text-xs text-muted-foreground truncate" title={user.email}>
            {user.name}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void logout().then(() => navigate("/login"))}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive font-medium text-sm group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
