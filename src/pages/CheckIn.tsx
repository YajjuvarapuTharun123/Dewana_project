import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    ArrowLeft,
    Users,
    CheckCircle,
    Clock,
    Camera,
    Search,
} from "lucide-react";
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
}

interface RSVP {
    id: string;
    guest_name: string;
    guest_email: string | null;
    guest_phone: string | null;
    num_guests: number;
    checked_in: boolean;
    checked_in_at: string | null;
    status: string;
}

export default function CheckIn() {
    const { eventId } = useParams<{ eventId: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [rsvps, setRsvps] = useState<RSVP[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

    // Stats
    const totalGuests = rsvps.filter(r => r.status === "yes").reduce((sum, r) => sum + r.num_guests, 0);
    const checkedInCount = rsvps.filter(r => r.checked_in).reduce((sum, r) => sum + r.num_guests, 0);
    const pendingCount = totalGuests - checkedInCount;

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && eventId) {
            fetchEventAndRSVPs();
        }
    }, [user, eventId]);

    useEffect(() => {
        return () => {
            if (scanner) {
                scanner.clear();
            }
        };
    }, [scanner]);

    // Auto-start scanner when page loads
    useEffect(() => {
        if (!loading && event && !scanning) {
            // Set scanning to true first to render the div
            setScanning(true);
        }
    }, [loading, event]);

    // Initialize scanner after div is rendered
    useEffect(() => {
        if (scanning && !scanner) {
            // Delay to ensure DOM is fully ready
            const timer = setTimeout(() => {
                initializeScanner();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [scanning]);

    const fetchEventAndRSVPs = async () => {
        if (!eventId) return;

        // Fetch event
        const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("id, event_name")
            .eq("id", eventId)
            .eq("user_id", user?.id)
            .single();

        if (eventError || !eventData) {
            toast({
                title: "Error",
                description: "Event not found or you don't have permission.",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        setEvent(eventData);

        // Fetch RSVPs
        await fetchRSVPs();
        setLoading(false);
    };

    const fetchRSVPs = async () => {
        const { data, error } = await supabase
            .from("rsvps")
            .select("*")
            .eq("event_id", eventId)
            .order("submitted_at", { ascending: false });

        if (!error && data) {
            setRsvps(data);
        }
    };

    const handleCheckIn = async (rsvpId: string) => {
        // First verify the RSVP exists and belongs to this event
        const { data: rsvpData, error: fetchError } = await supabase
            .from("rsvps")
            .select("id, guest_name, event_id, checked_in")
            .eq("id", rsvpId)
            .single();

        if (fetchError || !rsvpData) {
            toast({
                title: "Guest Not Found",
                description: "This ticket doesn't match any RSVP. The guest may not have registered or the QR code is invalid.",
                variant: "destructive",
            });
            return;
        }

        // Check if RSVP belongs to this event
        if (rsvpData.event_id !== eventId) {
            toast({
                title: "Wrong Event",
                description: "This ticket is for a different event. Please use the correct check-in page.",
                variant: "destructive",
            });
            return;
        }

        // Check if already checked in
        if (rsvpData.checked_in) {
            toast({
                title: "Already Checked In",
                description: `${rsvpData.guest_name} has already been checked in.`,
            });
            return;
        }

        // Proceed with check-in
        const { error } = await supabase
            .from("rsvps")
            .update({
                checked_in: true,
                checked_in_at: new Date().toISOString(),
            })
            .eq("id", rsvpId);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to check in guest. Please try again.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Guest Checked In! 🎉",
            description: `${rsvpData.guest_name} has been successfully checked in.`,
        });

        await fetchRSVPs();
    };

    const initializeScanner = () => {
        const element = document.getElementById("qr-reader");
        if (!element) {
            console.error("QR reader element not found");
            setScanning(false);
            toast({
                title: "Scanner Error",
                description: "Could not initialize QR scanner. Please try again.",
                variant: "destructive",
            });
            return;
        }

        try {
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                false
            );

            html5QrcodeScanner.render(
                async (decodedText) => {
                    // Decode the QR code data
                    console.log("Scanned Content:", decodedText);

                    try {
                        // Check if it's an Event Invitation URL (various patterns)
                        if (decodedText.startsWith("http") ||
                            decodedText.includes("/event/") ||
                            decodedText.includes("dewana")) {
                            toast({
                                title: "Wrong QR Code Type",
                                description: "This is the Event Invitation QR. Please ask the guest to show their 'Entry Ticket' QR code that they received after RSVP.",
                                variant: "destructive",
                            });
                            return;
                        }

                        const data = JSON.parse(decodedText);
                        if (data.rsvpId) {
                            await handleCheckIn(data.rsvpId);
                            html5QrcodeScanner.clear();
                            setScanning(false);
                            setScanner(null);
                        } else {
                            throw new Error("Invalid Ticket Format");
                        }
                    } catch (error) {
                        console.error("QR Parse Error:", error);
                        toast({
                            title: "Invalid Ticket",
                            description: "This QR code is not a valid guest entry ticket. Make sure the guest downloads their ticket after RSVP.",
                            variant: "destructive",
                        });
                    }
                },
                (errorMessage) => {
                    // Ignore scanning errors (normal during scanning)
                    // console.log(errorMessage); 
                }
            );

            setScanner(html5QrcodeScanner);
        } catch (error) {
            console.error("Scanner initialization error:", error);
            toast({
                title: "Camera Error",
                description: "Please allow camera access to scan QR codes",
                variant: "destructive",
            });
            setScanning(false);
        }
    };

    const startScanning = () => {
        setScanning(true);
    };

    const stopScanning = () => {
        if (scanner) {
            scanner.clear().catch(() => { });
            setScanner(null);
        }
        setScanning(false);
    };

    const filteredRSVPs = rsvps.filter(
        (rsvp) =>
            rsvp.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rsvp.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rsvp.guest_phone?.includes(searchTerm)
    );

    if (authLoading || loading) {
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
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/dashboard")}
                            className="gap-2 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                            Guest Check-In
                        </h1>
                        <p className="text-muted-foreground text-lg">{event.event_name}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="invitation-card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalGuests}</p>
                                    <p className="text-sm text-muted-foreground">Total Guests</p>
                                </div>
                            </div>
                        </div>

                        <div className="invitation-card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-dewana-emerald/10 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-dewana-emerald" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{checkedInCount}</p>
                                    <p className="text-sm text-muted-foreground">Checked In</p>
                                </div>
                            </div>
                        </div>

                        <div className="invitation-card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Scanner Section */}
                    {!scanning ? (
                        <div className="invitation-card p-8 mb-8 text-center">
                            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                                <Camera className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-display font-bold mb-2">
                                Scan Guest QR Code
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Point your camera at the guest's QR code to check them in
                            </p>
                            <Button
                                variant="gradient"
                                size="lg"
                                onClick={startScanning}
                                className="gap-2"
                            >
                                <Camera className="h-5 w-5" />
                                Start Scanning
                            </Button>
                        </div>
                    ) : (
                        <div className="invitation-card p-8 mb-8">
                            <div id="qr-reader" className="mb-4"></div>
                            <div className="text-center">
                                <Button variant="outline" onClick={stopScanning}>
                                    Stop Scanning
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Guest List */}
                    <div className="invitation-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-heading font-semibold">Guest List</h2>
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search guests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Guest Name</TableHead>
                                        <TableHead>Guests</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRSVPs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No RSVPs found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRSVPs
                                            .filter((rsvp) => rsvp.status === "yes")
                                            .map((rsvp) => (
                                                <TableRow key={rsvp.id}>
                                                    <TableCell className="font-medium">
                                                        {rsvp.guest_name}
                                                    </TableCell>
                                                    <TableCell>{rsvp.num_guests}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={rsvp.checked_in ? "default" : "secondary"}
                                                        >
                                                            {rsvp.checked_in ? "Checked In" : "Pending"}
                                                        </Badge>
                                                    </TableCell>
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
                                                    <TableCell>
                                                        {!rsvp.checked_in && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCheckIn(rsvp.id)}
                                                            >
                                                                Check In
                                                            </Button>
                                                        )}
                                                        {rsvp.checked_in && rsvp.checked_in_at && (
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(rsvp.checked_in_at).toLocaleTimeString()}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
