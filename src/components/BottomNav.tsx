import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, User, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const location = useLocation();
    const path = location.pathname;

    const isActive = (p: string) => path === p;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/10 md:hidden shadow-modern-lg">
            <div className="grid grid-cols-3 h-16 px-4">
                <Link
                    to="/dashboard"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-300 relative group btn-press",
                        isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {isActive("/dashboard") && (
                        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm rounded-2xl -z-10 animate-scale-in" />
                    )}
                    <LayoutDashboard className={cn("h-5 w-5 transition-all", isActive("/dashboard") && "scale-110")} />
                    <span className={cn("transition-all", isActive("/dashboard") && "font-semibold")}>Home</span>
                </Link>
                <Link
                    to="/create-event"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-300 btn-press",
                        isActive("/create-event") ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-full transition-all duration-300 shadow-lg",
                        isActive("/create-event")
                            ? "bg-gradient-to-br from-primary to-secondary scale-110"
                            : "bg-primary/10 hover:bg-primary/20"
                    )}>
                        <Plus className={cn("h-5 w-5", isActive("/create-event") ? "text-white" : "text-primary")} />
                    </div>
                </Link>
                <Link
                    to="/profile"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-300 relative group btn-press",
                        isActive("/profile") ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {isActive("/profile") && (
                        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm rounded-2xl -z-10 animate-scale-in" />
                    )}
                    <User className={cn("h-5 w-5 transition-all", isActive("/profile") && "scale-110")} />
                    <span className={cn("transition-all", isActive("/profile") && "font-semibold")}>Profile</span>
                </Link>
            </div>
            <div className="h-[env(safe-area-inset-bottom)] bg-background/80 backdrop-blur-lg" />
        </div>
    );
}
