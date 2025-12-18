import dewanaLogo from "@/assets/dewana-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "h-10", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <img src={dewanaLogo} alt="Dewana" className={className} />
      {showText && (
        <span className="font-display text-2xl font-bold text-gradient-primary">
          Dewana
        </span>
      )}
    </div>
  );
}
