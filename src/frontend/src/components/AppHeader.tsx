import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Shield } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { getInitials } from "../utils/helpers";

interface AppHeaderProps {
  isAdmin?: boolean;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  // Legacy tab props (kept for backward compat)
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}

export default function AppHeader({
  isAdmin,
  onMenuToggle,
  showMenuButton,
}: AppHeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const displayName =
    profile?.name || `${identity?.getPrincipal().toString().slice(0, 8)}...`;
  const initials = profile?.name ? getInitials(profile.name) : "??";

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="px-4 h-16 flex items-center gap-4">
        {/* Mobile hamburger */}
        {showMenuButton && (
          <button
            type="button"
            data-ocid="nav.menu_toggle.button"
            onClick={onMenuToggle}
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

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

        {/* Spacer */}
        <div className="flex-1" />

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
