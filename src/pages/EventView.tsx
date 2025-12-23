import { useEffect, useState } from "react";
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
import QRCode from "qrcode";
import { generateQRCodeWithLogo } from "@/lib/qr-code-utils";
import { getYouTubeEmbedUrl } from "@/lib/video-utils";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  PartyPopper,
  Share2,
  QrCode as QrCodeIcon,
  Heart,
  Download,
} from "lucide-react";
import { formatDate, getEventTypeEmoji } from "@/lib/supabase-helpers";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  custom_social_links?: any | null;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [showGuestQR, setShowGuestQR] = useState(false);
  const [guestQRCode, setGuestQRCode] = useState<string>("");
  const [guestRSVPId, setGuestRSVPId] = useState<string>("");
  const [rsvpForm, setRsvpForm] = useState<RSVPForm>({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    status: "yes",
    num_guests: 1,
    message: "",
  });

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      toast({
        title: "Event Not Found",
        description: "This event doesn't exist or is not available.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setEvent(data);
    setLoading(false);

    // Track view after event is loaded
    trackView(data.id);
  };

  const trackView = async (eventId: string) => {
    // Track event view
    await supabase.from("event_views").insert({
      event_id: eventId,
      viewed_at: new Date().toISOString(),
    });

    // Increment view count
    await supabase.rpc("increment_view_count", { event_id: eventId }).catch(() => {
      // Fallback if RPC doesn't exist - direct update
      supabase
        .from("events")
        .update({ view_count: (event?.view_count || 0) + 1 })
        .eq("id", eventId);
    });
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSubmittingRSVP(true);

    if (event.status !== "published") {
      toast({
        title: "Event is Draft",
        description: "You cannot RSVP to a draft event. Please publish it from the dashboard first.",
        variant: "destructive",
      });
      setSubmittingRSVP(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("rsvps").insert({
        event_id: event.id,
        guest_name: rsvpForm.guest_name,
        guest_email: rsvpForm.guest_email || null,
        guest_phone: rsvpForm.guest_phone || null,
        status: rsvpForm.status,
        num_guests: rsvpForm.num_guests,
        message: rsvpForm.message || null,
      }).select().single();

      if (error) throw error;

      toast({
        title: "RSVP Submitted!",
        description: "Thank you for your response. We look forward to seeing you!",
      });

      // Generate guest QR code with Dewana logo
      if (data && rsvpForm.status === "yes") {
        const qrData = JSON.stringify({ rsvpId: data.id });
        const qrDataUrl = await generateQRCodeWithLogo(qrData, {
          size: 400,
          logoSize: 80,
          margin: 2,
        });
        setGuestQRCode(qrDataUrl);
        setGuestRSVPId(data.id);
        setShowGuestQR(true);
      }

      // Reset form
      setRsvpForm({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        status: "yes",
        num_guests: 1,
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit RSVP",
        variant: "destructive",
      });
    } finally {
      setSubmittingRSVP(false);
    }
  };

  const downloadGuestQR = () => {
    if (!guestQRCode) return;
    const link = document.createElement("a");
    link.download = `guest-qr-${guestRSVPId}.png`;
    link.href = guestQRCode;
    link.click();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.event_name,
          text: `You're invited to ${event?.event_name}!`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Cover Image / Type */}
          <div className="invitation-card overflow-hidden mb-8">
            <div className="h-64 md:h-80 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.event_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl">{getEventTypeEmoji(event.event_type)}</span>
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {event.event_name}
              </h1>
              {event.host_names && (
                <p className="text-muted-foreground mb-4">Hosted by {event.host_names}</p>
              )}
              {event.description && (
                <p className="text-foreground/80 mb-6 whitespace-pre-wrap">
                  {event.description}
                </p>
              )}

              {/* Event Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-muted-foreground">
                      {formatDate(event.start_date)}
                    </p>
                  </div>
                </div>

                {event.venue_name && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">{event.venue_name}</p>
                      {event.venue_address && (
                        <p className="text-muted-foreground">{event.venue_address}</p>
                      )}
                    </div>
                  </div>
                )}

                {event.dress_code && (
                  <div className="flex items-start gap-3">
                    <PartyPopper className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Dress Code</p>
                      <p className="text-muted-foreground">{event.dress_code}</p>
                    </div>
                  </div>
                )}

                {event.parking_notes && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Parking</p>
                      <p className="text-muted-foreground">{event.parking_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Video Gallery */}
          {(event.youtube_link || (event.custom_social_links as any)?.instagram_url) && (
            <div className="invitation-card mb-8 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
                </div>
                <h2 className="text-2xl font-display font-bold">Event Gallery</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* YouTube Embed */}
                {event.youtube_link && getYouTubeEmbedUrl(event.youtube_link) && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                      Watch Video
                    </h3>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-md">
                      <iframe
                        src={getYouTubeEmbedUrl(event.youtube_link)!}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Instagram Link/Embed */}
                {(event.custom_social_links as any)?.instagram_url && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                      On Instagram
                    </h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border flex flex-col items-center justify-center text-center gap-4 h-full min-h-[200px]">
                      <div className="bg-white p-3 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                      </div>
                      <div>
                        <p className="font-medium text-lg">Check out our moments</p>
                        <p className="text-sm text-muted-foreground">Watch reels and photos on Instagram</p>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2 bg-white hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
                        onClick={() => window.open((event.custom_social_links as any)?.instagram_url, '_blank')}
                      >
                        View on Instagram
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RSVP Form */}
          {event.rsvp_enabled && (
            <div className="invitation-card p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-display font-bold">RSVP</h2>
              </div>

              <form onSubmit={handleRSVPSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="guest_name">Your Name *</Label>
                  <Input
                    id="guest_name"
                    required
                    value={rsvpForm.guest_name}
                    onChange={(e) =>
                      setRsvpForm({ ...rsvpForm, guest_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest_email">Email</Label>
                    <Input
                      id="guest_email"
                      type="email"
                      value={rsvpForm.guest_email}
                      onChange={(e) =>
                        setRsvpForm({ ...rsvpForm, guest_email: e.target.value })
                      }
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest_phone">Phone</Label>
                    <Input
                      id="guest_phone"
                      type="tel"
                      value={rsvpForm.guest_phone}
                      onChange={(e) =>
                        setRsvpForm({ ...rsvpForm, guest_phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Will you attend? *</Label>
                  <div className="flex gap-3 mt-2">
                    {[
                      { value: "yes", label: "Yes, I'll be there!", variant: "default" },
                      { value: "no", label: "Sorry, can't make it", variant: "outline" },
                      { value: "maybe", label: "Maybe", variant: "outline" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={rsvpForm.status === option.value ? "default" : "outline"}
                        onClick={() =>
                          setRsvpForm({
                            ...rsvpForm,
                            status: option.value as "yes" | "no" | "maybe",
                          })
                        }
                        className={cn(
                          "flex-1",
                          rsvpForm.status === option.value && "ring-2 ring-primary"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="num_guests">Number of Guests</Label>
                  <Input
                    id="num_guests"
                    type="number"
                    min="1"
                    value={rsvpForm.num_guests}
                    onChange={(e) =>
                      setRsvpForm({ ...rsvpForm, num_guests: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={rsvpForm.message}
                    onChange={(e) =>
                      setRsvpForm({ ...rsvpForm, message: e.target.value })
                    }
                    placeholder="Share your excitement or any message for the hosts..."
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  disabled={submittingRSVP}
                  className="w-full"
                >
                  {submittingRSVP ? "Submitting..." : "Submit RSVP"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Guest QR Code Dialog */}
      <Dialog open={showGuestQR} onOpenChange={setShowGuestQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Entry Ticket</DialogTitle>
            <DialogDescription>
              Save this QR code to check in at the event
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {guestQRCode && (
              <img
                src={guestQRCode}
                alt="Guest QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            )}
            <p className="text-sm text-muted-foreground text-center">
              Show this QR code to the host for quick check-in
            </p>
            <Button
              onClick={downloadGuestQR}
              variant="gradient"
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
