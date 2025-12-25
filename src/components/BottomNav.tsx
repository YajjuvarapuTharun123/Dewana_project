import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, User, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const location = useLocation();
    const path = location.pathname;

    const isActive = (p: string) => path === p;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border md:hidden">
            <div className="grid grid-cols-3 h-16">
                <Link
                    to="/dashboard"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                        isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Home</span>
                </Link>
                <Link
                    to="/create-event"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                        isActive("/create-event") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Plus className="h-5 w-5 text-primary" />
                    </div>
                </Link>
                <Link
                    to="/profile"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                        isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                </Link>
            </div>
            <div className="h-[env(safe-area-inset-bottom)] bg-background/80 backdrop-blur-lg" />
        </div>
    );
}
