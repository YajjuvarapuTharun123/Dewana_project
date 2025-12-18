import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import {
  Plus,
  Calendar,
  Users,
  Eye,
  QrCode as QrCodeIcon,
  Share2,
  Edit,
  MoreVertical,
  Sparkles,
  Download,
  Copy,
  X,
  CheckCircle
} from "lucide-react";
import { formatDate, getEventTypeEmoji } from "@/lib/supabase-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  cover_image_url: string | null;
  status: string;
  view_count: number;
  slug: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Dialog states
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [rsvps, setRsvps] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("events")
      .select("id, event_name, event_type, start_date, cover_image_url, status, view_count, slug")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoadingEvents(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-dewana-emerald/10 text-dewana-emerald border-dewana-emerald/20";
      case "draft":
        return "bg-accent/10 text-accent-foreground border-accent/20";
      case "past":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleQRCode = async (event: Event) => {
    setSelectedEvent(event);
    const eventUrl = `${window.location.origin}/event/${event.slug}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(eventUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
      setQrDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (event: Event) => {
    setSelectedEvent(event);
    const shareUrl = `${window.location.origin}/event/${event.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_name,
          text: `You're invited to ${event.event_name}!`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      setShareDialogOpen(true);
    }
  };

  const handleCopyLink = async () => {
    if (!selectedEvent) return;
    const shareUrl = `${window.location.origin}/event/${selectedEvent.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      });
      setShareDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleViewRSVPs = async (event: Event) => {
    setSelectedEvent(event);
    const { data, error } = await supabase
      .from("rsvps")
      .select("*")
      .eq("event_id", event.id)
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setRsvps(data);
    }
    setRsvpDialogOpen(true);
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !selectedEvent) return;
    const link = document.createElement("a");
    link.download = `${selectedEvent.slug}-qr-code.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Welcome, <span className="text-gradient-primary">{userName}!</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your events and create beautiful invitations.
            </p>
          </div>

          {/* Create Event Button */}
          <div className="mb-8">
            <Link to="/create-event">
              <Button variant="hero" size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New Event
              </Button>
            </Link>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="invitation-card p-6 animate-pulse">
                  <div className="h-40 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="invitation-card p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">
                Your First Celebration Awaits
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your first digital invitation and start sharing the joy with your loved ones.
              </p>
              <Link to="/create-event">
                <Button variant="gradient" size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Invite
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-heading font-semibold mb-4">Your Events</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="invitation-card overflow-hidden card-hover group">
                    {/* Cover Image */}
                    <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                      {event.cover_image_url ? (
                        <img
                          src={event.cover_image_url}
                          alt={event.event_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">{getEventTypeEmoji(event.event_type)}</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-1">
                        {event.event_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.start_date)}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {event.view_count}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link to={`/event/${event.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/edit-event/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleQRCode(event)}>
                              <QrCodeIcon className="h-4 w-4 mr-2" />
                              Event Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(event)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewRSVPs(event)}>
                              <Users className="h-4 w-4 mr-2" />
                              RSVPs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/checkin/${event.id}`)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check-in Guests
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code for guests to access your event invitation
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="Event QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            )}
            <div className="flex gap-2 w-full">
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => handleCopyLink()}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Share your event invitation with guests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Event Link
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={
                    selectedEvent
                      ? `${window.location.origin}/event/${selectedEvent.slug}`
                      : ""
                  }
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Share via
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/event/${selectedEvent?.slug}`;
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        `You're invited to ${selectedEvent?.event_name}! ${url}`
                      )}`,
                      "_blank"
                    );
                  }}
                  className="gap-2"
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/event/${selectedEvent?.slug}`;
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        url
                      )}`,
                      "_blank"
                    );
                  }}
                  className="gap-2"
                >
                  Facebook
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RSVP Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event RSVPs</DialogTitle>
            <DialogDescription>
              View all RSVPs for {selectedEvent?.event_name}
            </DialogDescription>
          </DialogHeader>
          {rsvps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No RSVPs yet. Share your event to start receiving responses!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rsvps.map((rsvp) => (
                    <TableRow key={rsvp.id}>
                      <TableCell className="font-medium">
                        {rsvp.guest_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rsvp.status === "yes"
                              ? "default"
                              : rsvp.status === "no"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {rsvp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rsvp.num_guests}</TableCell>
                      <TableCell className="text-sm">
                        {rsvp.guest_email && (
                          <div className="truncate max-w-[150px]">
                            {rsvp.guest_email}
                          </div>
                        )}
                        {rsvp.guest_phone && (
                          <div className="text-muted-foreground">
                            {rsvp.guest_phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {rsvp.message && (
                          <div className="truncate" title={rsvp.message}>
                            {rsvp.message}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
