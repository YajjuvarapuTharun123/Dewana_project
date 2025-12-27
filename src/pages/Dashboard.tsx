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
import { useEventNotifications } from "@/hooks/useEventNotifications";
import {
  Plus,
  Calendar,
  Eye,
  Share2,
  Edit,
  MoreVertical,
  Sparkles,
  Copy,
  Trash2,
  Users,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [activeTab, setActiveTab] = useState<"hosting" | "attending">("hosting");

  // Dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Enable event notifications for all events (hosting + attending)
  useEventNotifications([...events, ...attendingEvents]);

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

    // Fetch hosted events
    const { data: hostedData, error: hostedError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!hostedError && hostedData) {
      setEvents(hostedData);
    }

    // Fetch attending events
    // 1. Get RSVPs with user's email
    if (user.email) {
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("event_id, guest_email")
        .ilike("guest_email", user.email);

      if (!rsvpError && rsvpData && rsvpData.length > 0) {
        const eventIds = rsvpData.map(r => r.event_id);

        // 2. Fetch events details
        const { data: attendingData, error: attendingError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds)
          .order("start_date", { ascending: true });

        console.log("Attending Events Fetch Result:", { attendingData, attendingError });

        if (!attendingError && attendingData) {
          setAttendingEvents(attendingData);
          console.log("Setting attending events:", attendingData);

          // UX Improvement: Auto-switch to Attending tab if user has no hosted events
          if ((!hostedData || hostedData.length === 0) && attendingData.length > 0) {
            console.log("Auto-switching to Attending tab");
            setActiveTab("attending");
          }
        } else {
          console.error("Error fetching attending events:", attendingError);
        }
      } else {
        console.log("No RSVPs found for this user.");
      }
    }

    setLoadingEvents(false);
  };

  // Check for events happening today
  useEffect(() => {
    if (!loadingEvents && attendingEvents.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const todaysEvents = attendingEvents.filter(event => {
        const eventDate = new Date(event.start_date).toISOString().split('T')[0];
        return eventDate === todayStr;
      });

      if (todaysEvents.length > 0) {
        todaysEvents.forEach(event => {
          toast({
            title: `🎉 It's ${event.event_name} Today!`,
            description: "Don't forget to attend! Check your QR code.",
            duration: 10000,
          });
        });
      }
    }
  }, [loadingEvents, attendingEvents, toast]);

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



  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent || !user) return;

    setIsDeleting(true);
    try {
      // First delete related RSVPs
      await supabase
        .from("rsvps")
        .delete()
        .eq("event_id", selectedEvent.id);

      // Then delete the event
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", selectedEvent.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your event has been successfully deleted.",
      });

      // Refresh events list
      await fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
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
                <div key={i} className="invitation-card p-6">
                  <div className="h-40 skeleton rounded-lg mb-4" />
                  <div className="h-4 skeleton rounded w-3/4 mb-2" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : events.length === 0 && attendingEvents.length === 0 ? (
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
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Dashboard Tabs */}
              <div className="flex items-center gap-6 mb-6 border-b relative">
                <button
                  onClick={() => setActiveTab("hosting")}
                  className={`pb-3 px-1 text-sm font-medium transition-all duration-300 btn-press ${activeTab === "hosting"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Hosting ({events.length})
                </button>
                <button
                  onClick={() => setActiveTab("attending")}
                  className={`pb-3 px-1 text-sm font-medium transition-all duration-300 btn-press ${activeTab === "attending"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Attending ({attendingEvents.length})
                </button>
                <div
                  className="absolute bottom-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                  style={{
                    width: activeTab === "hosting" ? `${80}px` : `${90}px`,
                    left: activeTab === "hosting" ? '4px' : `${110}px`
                  }}
                />
              </div>



              {activeTab === "hosting" ? (
                /* Hosting Grid */
                events.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground" > You haven't created any events yet.</p>
                    <Link to="/create-event" className="mt-4 inline-block">
                      <Button variant="outline" size="sm">Create Event</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, index) => (
                      <div key={event.id} className="card-modern card-elevated stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Cover Image */}
                        <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {event.cover_image_url ? (
                            <>
                              <img
                                src={event.cover_image_url}
                                alt={event.event_name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-5xl">{getEventTypeEmoji(event.event_type)}</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge className={`${getStatusColor(event.status)} badge-modern shadow-sm`}>
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
                            <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full btn-press hover:border-primary">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </a>
                            <Link to={`/edit-event/${event.id}`} state={{ event }}>
                              <Button variant="ghost" size="sm" className="btn-press hover:bg-primary/10 hover:text-primary">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="btn-press">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card animate-slide-up">
                                <DropdownMenuItem onClick={() => handleShare(event)} className="cursor-pointer">
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewRSVPs(event)} className="cursor-pointer">
                                  <Users className="h-4 w-4 mr-2" />
                                  RSVPs
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(event)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Attending Grid */
                attendingEvents.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">You haven't RSVP'd to any events yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attendingEvents.map((event, index) => (
                      <div key={event.id} className="card-modern card-elevated stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Cover Image */}
                        <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {event.cover_image_url ? (
                            <>
                              <img
                                src={event.cover_image_url}
                                alt={event.event_name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-5xl">{getEventTypeEmoji(event.event_type)}</span>
                            </div>
                          )}
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

                          <div className="flex items-center gap-2">
                            <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer" className="w-full">
                              <Button variant="gradient" size="sm" className="w-full btn-press shadow-lg hover:shadow-xl">
                                <Eye className="h-4 w-4 mr-2" />
                                View Event
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      <Footer />



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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.event_name}"? This action cannot be undone. All RSVPs and event data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
