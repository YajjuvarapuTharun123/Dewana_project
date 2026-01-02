import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  PartyPopper,
  Share2,
  Heart,
  Music,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Check,
  Instagram,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { getYouTubeEmbedUrl, isYouTubeVideoUrl, isYouTubeChannelUrl, isInstagramUrl, isInstagramPostUrl, isInstagramProfileUrl, getInstagramEmbedUrl } from "@/lib/video-utils";
import { formatDate, getEventTypeEmoji } from "@/lib/supabase-helpers";
import { generateCalendarLink, addToGoogleCalendar } from "@/lib/googleCalendar";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  description: string | null;
  host_names: string | null;
  start_date: string;
  venue_name: string | null;
  venue_address: string | null;
  parking_notes: string | null;
  dress_code: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
  status: string;
  slug: string;
  view_count?: number;
  youtube_link?: string | null;
  custom_social_links?: any[] | any | null;
  google_photos_url?: string | null;
  google_drive_url?: string | null;
  sub_events?: {
    id: string;
    name: string;
    date_time: string;
    location_name: string | null;
  }[];
}

interface RSVPForm {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  status: "yes" | "no" | "maybe";
  num_guests: number;
  message: string;
}

export default function EventView() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [existingRSVP, setExistingRSVP] = useState<any>(null);
  const [rsvpForm, setRsvpForm] = useState<RSVPForm>({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    status: "yes",
    num_guests: 1,
    message: "",
  });

  const { scrollY } = useScroll();
  const yRange = useTransform(scrollY, [0, 500], [0, 250]);
  const opacityRange = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  useEffect(() => {
    if (user) {
      setRsvpForm(prev => ({
        ...prev,
        guest_name: user.user_metadata?.name || user.user_metadata?.full_name || prev.guest_name,
        guest_email: user.email || prev.guest_email
      }));
      if (event) checkExistingRSVP();
    }
  }, [user, event]);

  const checkExistingRSVP = async () => {
    if (!user?.email || !event?.id) return;
    const { data } = await supabase.from("rsvps").select("*").eq("event_id", event.id).ilike("guest_email", user.email!).limit(1).maybeSingle();
    if (data) setExistingRSVP(data);
  };

  const fetchEvent = async () => {
    const { data, error } = await supabase.from("events").select("*, sub_events(*)").eq("slug", slug).single();

    if (error || !data) {
      toast({ title: "Event Not Found", description: "This event doesn't exist.", variant: "destructive" });
      navigate("/");
      return;
    }

    if (data.sub_events) {
      data.sub_events.sort((a: any, b: any) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    }

    setEvent(data);
    setLoading(false);
    trackView(data.id);
  };

  const trackView = async (eventId: string) => {
    try {
      await supabase.from("event_views").insert({ event_id: eventId });
      await supabase.rpc("increment_view_count", { event_id: eventId });
    } catch (error) {
      console.warn("Analytics tracking failed:", error);
    }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmittingRSVP(true);

    if (event.status !== "published") {
      toast({ title: "Event is Draft", description: "Event not yet published.", variant: "destructive" });
      setSubmittingRSVP(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("create_guest_rsvp", {
        p_event_id: event.id,
        p_guest_name: rsvpForm.guest_name,
        p_guest_email: rsvpForm.guest_email.toLowerCase(),
        p_guest_phone: rsvpForm.guest_phone || null,
        p_status: rsvpForm.status,
        p_num_guests: rsvpForm.num_guests,
        p_message: rsvpForm.message || null,
      });

      if (error) throw error;

      // 2. Notify the guest (confirmation) if they are logged in
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: "RSVP Submitted Successfully! ✅",
          message: `You're all set for "${event.event_name}".`,
          type: "system",
          event_id: event.id,
        });
      }

      toast({
        title: "RSVP Received! 🎉",
        description: "You're on the list. Add to your calendar below!",
        duration: 5000
      });
      setExistingRSVP({ id: data, ...rsvpForm });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit RSVP", variant: "destructive" });
    } finally {
      setSubmittingRSVP(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.event_name,
          text: `You're invited to ${event?.event_name}!`,
          url: window.location.href,
        });
      } catch (e) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied!", description: "Event link copied to clipboard" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden font-body">
      <Navbar />

      {/* Floating Back Button */}
      <div className="fixed top-24 left-6 z-50">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="secondary"
          size="sm"
          className="rounded-full bg-background/50 backdrop-blur-md border border-white/20 shadow-lg hover:bg-background/80 transition-all group flex items-center gap-2 px-4 h-10"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.div style={{ y: yRange }} className="absolute inset-0">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.event_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-orange/20 to-brand-magenta/20 flex items-center justify-center">
              <span className="text-9xl opacity-20 filter blur-sm select-none">{getEventTypeEmoji(event.event_type)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        </motion.div>

        <motion.div
          style={{ opacity: opacityRange }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10 text-white"
        >
          <Badge variant="secondary" className="mb-4 backdrop-blur-md bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm uppercase tracking-wider">
            {event.event_type}
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-4 drop-shadow-lg leading-tight">
            {event.event_name}
          </h1>
          {event.host_names && (
            <p className="text-lg md:text-xl font-medium tracking-wide drop-shadow-md">
              Hosted by {event.host_names}
            </p>
          )}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10"
          >
            <ChevronDown className="h-8 w-8 text-white/70" />
          </motion.div>
        </motion.div>
      </div>

      <main className="relative z-20 -mt-20 container mx-auto px-4 pb-20 max-w-5xl">
        {/* Main Content Card */}
        <div className="glass-card rounded-3xl p-6 md:p-12 shadow-2xl border-t border-white/20">

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">Date & Time</h3>
                  <p className="text-muted-foreground text-lg">{formatDate(event.start_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">Venue</h3>
                  <p className="text-muted-foreground font-medium">{event.venue_name || "TBA"}</p>
                  {event.venue_address && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.venue_address}</p>}
                  {event.venue_name && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((event.venue_name || "") + " " + (event.venue_address || ""))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary mt-2 inline-flex items-center hover:underline"
                    >
                      View Map <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {event.dress_code && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <PartyPopper className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">Dress Code</h3>
                    <p className="text-muted-foreground">{event.dress_code}</p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-border/50">
                  <h3 className="font-heading font-semibold mb-2 text-sm uppercase tracking-widest text-muted-foreground">Message from Host</h3>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed italic">"{event.description}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Itinerary / Sub-events */}
          {event.sub_events && event.sub_events.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-brand-gold" /> Itinerary
              </h2>
              <div className="relative border-l-2 border-border/50 ml-3 space-y-8 pl-8 py-2">
                {event.sub_events.map((sub, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-background bg-primary" />
                    <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                      <h3 className="font-bold text-lg text-primary">{sub.name}</h3>
                      <div className="text-sm text-muted-foreground flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(sub.date_time).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(sub.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {sub.location_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {sub.location_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery & Media (Real-time App Feel) */}
          {(event.youtube_link || event.google_photos_url || (event.custom_social_links && Array.isArray(event.custom_social_links) && event.custom_social_links.length > 0)) && (
            <div className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-brand-gold" /> Media & Highlights
              </h2>

              <div className="space-y-8">
                {/* YouTube Link */}
                {event.youtube_link && isYouTubeVideoUrl(event.youtube_link) && getYouTubeEmbedUrl(event.youtube_link) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Video className="h-4 w-4" /> Video Highlight
                    </h3>
                    <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 glass-card">
                      <iframe
                        src={getYouTubeEmbedUrl(event.youtube_link)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Instagram Content Grid */}
                {event.custom_social_links && Array.isArray(event.custom_social_links) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {event.custom_social_links.map((link: any, idx: number) => {
                      const isInsta = isInstagramUrl(link.url);
                      const isPost = isInstagramPostUrl(link.url);
                      const isProfile = isInstagramProfileUrl(link.url);
                      const embedUrl = getInstagramEmbedUrl(link.url);

                      if (!isInsta) return null;

                      return (
                        <div key={idx} className="space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="p-1 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded text-white"><Instagram className="h-3 w-3" /></span>
                            {isPost ? "Instagram Moment" : "Instagram Profile"}
                          </h3>

                          {isPost && embedUrl ? (
                            <div className="rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-black/5 min-h-[450px]">
                              <iframe
                                src={embedUrl}
                                className="w-full h-[600px] border-none"
                                scrolling="no"
                                allowTransparency={true}
                              ></iframe>
                            </div>
                          ) : (
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="block group">
                              <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between transition-all hover:scale-[1.02] hover:bg-white/5 shadow-lg group">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                      <Instagram className="h-8 w-8 text-[#dc2743]" />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-lg">View Instagram</div>
                                    <div className="text-sm text-muted-foreground">{isProfile ? "Visit Profile" : "View Link"}</div>
                                  </div>
                                </div>
                                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <ExternalLink className="h-5 w-5" />
                                </div>
                              </div>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Google Photos Album Enhanced */}
                {event.google_photos_url && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Photo Memories
                    </h3>
                    <a href={event.google_photos_url} target="_blank" rel="noopener noreferrer" className="block group">
                      <div className="relative h-64 w-full rounded-3xl overflow-hidden shadow-2xl group transition-all hover:scale-[1.01]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-green-500/20 to-yellow-500/20 animate-gradient" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all">
                          <div className="w-20 h-20 rounded-2xl bg-white shadow-2xl flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform duration-500">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Photos_icon_%282020%29.svg" alt="Google Photos" className="w-12 h-12" />
                          </div>
                          <h4 className="text-2xl font-bold text-white drop-shadow-lg">Event Photo Album</h4>
                          <p className="text-white/80 mt-2 font-medium">Click to view all shared memories on Google Photos</p>

                          <div className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold text-sm shadow-xl flex items-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors">
                            Open Gallery <ExternalLink className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RSVP Section */}
          <div id="rsvp" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-background to-secondary/5 rounded-2xl border border-secondary/20 p-6 md:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center p-3 bg-secondary/10 rounded-full text-secondary mb-4">
                  <Heart className="h-6 w-6 fill-current" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-2">RSVP</h2>
                <p className="text-muted-foreground mb-8">Please let us know if you'll be joining our celebration.</p>

                {existingRSVP ? (
                  <div className="bg-background/80 backdrop-blur p-6 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                      <Check className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-1">Response Recorded</h3>
                    <p className="text-green-700">
                      You're attending: <span className="font-bold uppercase">{existingRSVP.status}</span>
                      {existingRSVP.status === 'yes' && ` with ${existingRSVP.num_guests} guest(s)`}
                    </p>
                    {existingRSVP.status === 'yes' && (
                      <a
                        href={generateCalendarLink({
                          title: event.event_name,
                          description: event.description || '',
                          location: `${event.venue_name || ''} ${event.venue_address || ''}`.trim(),
                          startDate: event.start_date,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Calendar className="h-4 w-4" />
                        Add to Google Calendar
                      </a>
                    )}
                  </div>
                ) : event.rsvp_enabled ? (
                  !user ? (
                    <div className="bg-background/80 backdrop-blur p-8 rounded-xl border border-primary/20 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Sign In to RSVP</h3>
                      <p className="text-muted-foreground mb-6">
                        Please sign in to let us know if you'll be joining this celebration.
                      </p>
                      <Button
                        onClick={() => navigate('/auth')}
                        variant="hero"
                        size="lg"
                        className="shadow-glow-orange"
                      >
                        Sign In to Continue
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRSVPSubmit} className="space-y-6 text-left">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input required value={rsvpForm.guest_name} onChange={e => setRsvpForm({ ...rsvpForm, guest_name: e.target.value })} placeholder="Your Name" />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input type="email" required value={rsvpForm.guest_email} onChange={e => setRsvpForm({ ...rsvpForm, guest_email: e.target.value })} placeholder="email@example.com" disabled={!!user?.email} />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Will you attend?</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {['yes', 'maybe', 'no'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setRsvpForm({ ...rsvpForm, status: opt as any })}
                              className={cn(
                                "py-3 rounded-lg border font-medium capitalize transition-all",
                                rsvpForm.status === opt
                                  ? "bg-primary text-white border-primary shadow-md transform scale-105"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {rsvpForm.status === 'yes' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                          <Label>Total Guests (including you)</Label>
                          <Input type="number" min="1" max="10" value={rsvpForm.num_guests} onChange={e => setRsvpForm({ ...rsvpForm, num_guests: parseInt(e.target.value) })} />
                        </motion.div>
                      )}

                      <div>
                        <Label>Message (Optional)</Label>
                        <Textarea value={rsvpForm.message} onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })} placeholder="Any food preferences or warm wishes?" />
                      </div>

                      <Button type="submit" variant="hero" size="lg" className="w-full text-lg shadow-glow-orange" disabled={submittingRSVP}>
                        {submittingRSVP ? <Loader2 className="animate-spin" /> : "Confirm Attendance"}
                      </Button>
                    </form>
                  )
                ) : (
                  <p className="text-muted-foreground italic">RSVPs are currently closed for this event.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      <div className="fixed bottom-24 right-6 z-50 md:bottom-6">
        <Button
          onClick={handleShare}
          size="icon"
          className="rounded-full h-14 w-14 shadow-2xl bg-gradient-to-r from-brand-orange to-brand-magenta text-white hover:opacity-90 border-none animate-pulse-subtle"
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>

      <Footer />
    </div>
  );
}
