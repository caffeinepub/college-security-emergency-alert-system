import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { getInitials } from "../utils/helpers";

type Tab = "home" | "dashboard" | "alerts" | "reports" | "contacts";

interface AppHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isAdmin?: boolean;
}

export default function AppHeader({
  activeTab,
  onTabChange,
  isAdmin,
}: AppHeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const displayName =
    profile?.name || `${identity?.getPrincipal().toString().slice(0, 8)}...`;
  const initials = profile?.name ? getInitials(profile.name) : "??";

  const navItems: { key: Tab; label: string }[] = isAdmin
    ? [
        { key: "dashboard", label: "Dashboard" },
        { key: "alerts", label: "Alerts" },
        { key: "reports", label: "Reports" },
      ]
    : [
        { key: "home", label: "Home" },
        { key: "dashboard", label: "Dashboard" },
        { key: "alerts", label: "Alerts" },
        { key: "reports", label: "Reports" },
        { key: "contacts", label: "Contacts" },
      ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.35 0.12 15))",
            }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black uppercase tracking-wider leading-none text-foreground">
              Guardian
            </div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Campus Safety
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
          {navItems.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              data-ocid={`nav.${key}.link`}
              onClick={() => onTabChange(key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === key
                  ? "text-nav-active border-b-2"
                  : "text-foreground/70 hover:text-foreground"
              }`}
              style={
                activeTab === key
                  ? { borderColor: "oklch(var(--nav-active))" }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="flex md:hidden flex-1 justify-center gap-1">
          {navItems.slice(0, 3).map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => onTabChange(key)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === key
                  ? "text-nav-active font-bold"
                  : "text-foreground/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-secondary text-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <div className="text-xs font-semibold text-foreground leading-none">
                {displayName}
              </div>
              {isAdmin && (
                <div className="text-[10px] text-nav-active font-medium">
                  Admin
                </div>
              )}
            </div>
          </div>
          <Button
            data-ocid="nav.logout.button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
