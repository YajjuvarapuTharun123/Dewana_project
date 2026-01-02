import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEventNotifications } from "@/hooks/useEventNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventStatus } from "@/hooks/useEventStatus";
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
  Search,
  Filter
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
  end_date: string | null;
  cover_image_url: string | null;
  status: string;
  view_count: number;
  slug: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
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

  // Enable event notifications
  useEventNotifications([...events, ...attendingEvents]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (location.search.includes("tab=attending")) {
      setActiveTab("attending");
    }
  }, [location.search]);

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
    if (user.email) {
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("event_id, guest_email")
        .ilike("guest_email", user.email);

      if (!rsvpError && rsvpData && rsvpData.length > 0) {
        const eventIds = rsvpData.map(r => r.event_id);
        const { data: attendingData, error: attendingError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds)
          .order("start_date", { ascending: true });

        if (!attendingError && attendingData) {
          setAttendingEvents(attendingData);
          if ((!hostedData || hostedData.length === 0) && attendingData.length > 0 && !location.search.includes("tab=attending")) {
            // Only auto switch if not explicitly set via URL, but simpler logic is fine
            // Keep existing behavior or refine
          }
        }
      }
    }
    setLoadingEvents(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-dewana-emerald/10 text-dewana-emerald border-dewana-emerald/20";
      case "draft": return "bg-accent/10 text-accent-foreground border-accent/20";
      case "past": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground";
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
      } catch (error) { }
    } else {
      setShareDialogOpen(true);
    }
  };

  const handleCopyLink = async () => {
    if (!selectedEvent) return;
    const shareUrl = `${window.location.origin}/event/${selectedEvent.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!", description: "Event link copied to clipboard" });
      setShareDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleViewRSVPs = async (event: Event) => {
    setSelectedEvent(event);
    const { data, error } = await supabase
      .from("rsvps")
      .select("*")
      .eq("event_id", event.id)
      .order("submitted_at", { ascending: false });
    if (!error && data) setRsvps(data);
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
      await supabase.from("rsvps").delete().eq("event_id", selectedEvent.id);
      const { error } = await supabase.from("events").delete().eq("id", selectedEvent.id).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Event Deleted", description: "Your event has been successfully deleted." });
      await fetchEvents();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete event", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <Sidebar />

      <main className="flex-1 pt-20 lg:pl-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                <span className="text-muted-foreground text-2xl md:text-3xl">Namaste,</span> <br className="md:hidden" />
                <span className="text-gradient-primary">{userName}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of your upcoming celebrations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." className="pl-9 bg-card/50 backdrop-blur-sm" />
              </div>
              <Link to="/create-event">
                <Button variant="hero" size="lg" className="hidden md:flex gap-2 shadow-glow-orange">
                  <Plus className="h-5 w-5" />
                  Create Event
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mb-8 border-b border-border/50">
            <button
              onClick={() => setActiveTab("hosting")}
              className={`pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === "hosting"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Hosting
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{events.length}</span>
              {activeTab === "hosting" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab("attending")}
              className={`pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === "attending"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Attending
              <span className="ml-2 bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs">{attendingEvents.length}</span>
              {activeTab === "attending" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-t-full" />}
            </button>
          </div>

          {/* Content Grid */}
          {loadingEvents ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-4 space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === "hosting" && (
                events.length === 0 ? (
                  <EmptyState type="hosting" />
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                    {events.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isHosting
                        onShare={() => handleShare(event)}
                        onDelete={() => handleDeleteClick(event)}
                        onRSVP={() => handleViewRSVPs(event)}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )
              )}

              {activeTab === "attending" && (
                attendingEvents.length === 0 ? (
                  <EmptyState type="attending" />
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                    {attendingEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isHosting={false}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        selectedEvent={selectedEvent}
        onCopy={handleCopyLink}
      />
      <RSVPDialog
        open={rsvpDialogOpen}
        onOpenChange={setRsvpDialogOpen}
        selectedEvent={selectedEvent}
        rsvps={rsvps}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        eventName={selectedEvent?.event_name}
      />
    </div>
  );
}

// Subcomponents for cleaner code
function EmptyState({ type }: { type: 'hosting' | 'attending' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/30 rounded-2xl border border-dashed border-border/50 animate-fade-in">
      <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
        {type === 'hosting' ? <Sparkles className="h-8 w-8 text-primary" /> : <Calendar className="h-8 w-8 text-secondary" />}
      </div>
      <h3 className="text-xl font-heading font-semibold mb-2">
        {type === 'hosting' ? "Host Your First Celebration" : "No Upcoming Events"}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        {type === 'hosting'
          ? "Create stunning invitations for weddings, birthdays, and parties in minutes."
          : "You haven't RSVP'd to any events yet. Only events you're attending will appear here."}
      </p>
      {type === 'hosting' && (
        <Link to="/create-event">
          <Button variant="gradient" size="lg" className="shadow-glow-orange group">
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Create New Event
          </Button>
        </Link>
      )}
    </div>
  );
}

// Inside EventCard component

function EventCard({ event, isHosting, onShare, onDelete, onRSVP, getStatusColor }: any) {
  const navigate = useNavigate();
  const realTimeStatus = useEventStatus(event.start_date, event.end_date);

  const getDynamicStatusColor = (status: string) => {
    switch (status) {
      case "Live": return "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse";
      case "Upcoming": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Completed": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <div className="group rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden flex flex-col h-full bg-gradient-to-b from-card to-background/50">
      {/* Image */}
      <div className="h-48 relative overflow-hidden bg-muted">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.event_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <span className="text-6xl">{getEventTypeEmoji(event.event_type)}</span>
          </div>
        )}

        {/* Status Badge - Show for both hosting and attending for better UX */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={getDynamicStatusColor(realTimeStatus)}>
            {realTimeStatus}
          </Badge>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
          {isHosting && (
            <div className="flex gap-2 w-full">
              <Button size="sm" variant="secondary" className="flex-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all delay-75" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Link to={`/edit-event/${event.id}`} className="flex-1">
                <Button size="sm" variant="default" className="w-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all delay-100">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{event.event_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            {formatDate(event.start_date)}
          </div>
          {isHosting && (
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {event.view_count} Views
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border/50 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            onClick={() => navigate(`/event/${event.slug}`)}
          >
            <Eye className="h-4 w-4 mr-2" /> View
          </Button>
          {isHosting && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onShare}><Share2 className="mr-2 h-4 w-4" /> Share</DropdownMenuItem>
                <DropdownMenuItem onClick={onRSVP}><Users className="mr-2 h-4 w-4" /> RSVPs</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}

function ShareDialog({ open, onOpenChange, selectedEvent, onCopy }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Invitation</DialogTitle>
          <DialogDescription>Send this invite to your guests</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input readOnly value={selectedEvent ? `${window.location.origin}/event/${selectedEvent.slug}` : ""} className="flex-1 bg-muted" />
            <Button onClick={onCopy} variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`You're invited! ${window.location.origin}/event/${selectedEvent?.slug}`)}`, "_blank")}>WhatsApp</Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/event/${selectedEvent?.slug}`)}`, "_blank")}>Facebook</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RSVPDialog({ open, onOpenChange, selectedEvent, rsvps }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest List ({rsvps.length})</DialogTitle>
          <DialogDescription>{selectedEvent?.event_name}</DialogDescription>
        </DialogHeader>
        {rsvps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">No RSVPs yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead className="text-right">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsvps.map((rsvp: any) => (
                <TableRow key={rsvp.id}>
                  <TableCell className="font-medium">
                    <div>{rsvp.guest_name}</div>
                    <div className="text-xs text-muted-foreground">{rsvp.guest_email}</div>
                  </TableCell>
                  <TableCell><Badge variant={rsvp.status === 'yes' ? 'default' : 'secondary'}>{rsvp.status}</Badge></TableCell>
                  <TableCell>{rsvp.num_guests}</TableCell>
                  <TableCell className="text-right text-xs max-w-[200px] truncate">{rsvp.message || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ open, onOpenChange, isDeleting, onConfirm, eventName }: any) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this event?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{eventName}"? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? "Deleting..." : "Delete Event"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
