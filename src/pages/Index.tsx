import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  QrCode,
  Users,
  Calendar,
  MapPin,
  Share2,
  CheckCircle2,
  ArrowRight,
  Star
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Beautiful Templates",
    description: "Stunning designs inspired by Indian traditions for every celebration"
  },
  {
    icon: QrCode,
    title: "QR Code Invites",
    description: "Generate beautiful QR codes to share your invitations easily"
  },
  {
    icon: Users,
    title: "RSVP Tracking",
    description: "Track guest responses, meal preferences, and plus-ones effortlessly"
  },
  {
    icon: Calendar,
    title: "Multi-Event Support",
    description: "Add sub-events like Haldi, Mehendi, Sangeet all in one invite"
  },
  {
    icon: MapPin,
    title: "Venue Integration",
    description: "Integrate Google Maps for easy navigation to your venue"
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share via WhatsApp, social media, or direct link in seconds"
  }
];

const eventTypes = [
  { emoji: "🎊", name: "Wedding / Shaadi", color: "from-primary to-secondary" },
  { emoji: "🎂", name: "Birthday", color: "from-dewana-rose to-secondary" },
  { emoji: "🪔", name: "Festival", color: "from-accent to-primary" },
  { emoji: "🎓", name: "Graduation", color: "from-dewana-blue to-dewana-emerald" },
  { emoji: "👶", name: "Baby Shower", color: "from-dewana-rose to-accent" },
  { emoji: "💼", name: "Corporate", color: "from-foreground/80 to-foreground/60" },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pattern-paisley opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-sm font-heading text-foreground/80">
                10,000+ events created this month
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-in-up">
              Create Beautiful
              <span className="block text-gradient-primary">Digital Invitations</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-body animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Where <span className="text-primary font-semibold">Technology</span> meets{" "}
              <span className="text-secondary font-semibold">Tradition</span>.
              Craft stunning event invitations with RSVP tracking, QR codes, and more — completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Start Your Celebration
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Event Type Cards */}
          <div className="mt-16 md:mt-24">
            <p className="text-center text-sm font-heading text-muted-foreground mb-6">
              PERFECT FOR EVERY CELEBRATION
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
              {eventTypes.map((event, index) => (
                <div
                  key={event.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-soft card-hover animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <span className="text-xl">{event.emoji}</span>
                  <span className="text-sm font-heading">{event.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need for
              <span className="text-gradient-primary"> Perfect Invitations</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Create, share, and manage your event invitations with powerful features designed for Indian celebrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="invitation-card p-6 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 pattern-mandala">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Create Your Invite in
              <span className="text-gradient-gold"> 3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Choose Your Event", desc: "Select from weddings, birthdays, festivals & more" },
              { step: "02", title: "Customize Details", desc: "Add venue, sub-events, and beautiful designs" },
              { step: "03", title: "Share & Track", desc: "Send via WhatsApp or QR code, track RSVPs live" },
            ].map((item, index) => (
              <div
                key={item.step}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 rounded-full gradient-primary text-primary-foreground font-display text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Create Your
              <span className="text-gradient-primary"> Beautiful Invitation?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of families who've made their celebrations memorable with Dewana.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="group">
                  Create Your Invite — Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
              {["No payment required", "Unlimited invitations", "Beautiful templates"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-dewana-emerald" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
