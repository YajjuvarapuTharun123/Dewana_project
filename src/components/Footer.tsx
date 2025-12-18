import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 py-12 pattern-mandala">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo />
            <p className="text-muted-foreground text-sm font-heading italic">
              Technology meets Tradition
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Create Invite
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-secondary fill-secondary" /> for Indian celebrations
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dewana. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
