import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    PartyPopper,
    Cake,
    Flame,
    GraduationCap,
    Baby,
    Briefcase,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const eventTypes = [
    { id: "wedding", name: "Wedding / Shaadi", emoji: "🎊", icon: PartyPopper },
    { id: "birthday", name: "Birthday", emoji: "🎂", icon: Cake },
    { id: "festival", name: "Festival Celebration", emoji: "🪔", icon: Flame },
    { id: "graduation", name: "Graduation", emoji: "🎓", icon: GraduationCap },
    { id: "baby-shower", name: "Baby Shower", emoji: "👶", icon: Baby },
    { id: "corporate", name: "Corporate Event", emoji: "💼", icon: Briefcase },
    { id: "other", name: "Other", emoji: "🎉", icon: Sparkles },
];

const steps = [
    { id: 1, name: "Event Type" },
    { id: 2, name: "Basic Info" },
    { id: 3, name: "Venue" },
];

export default function EditEvent() {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Failsafe timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setLoading(false);
                if (!id && !user) return; // Don't show error if redirected
                // Only show error if we're still on this page and stuck
                if (user && id) {
                    toast({
                        title: "Request Timeout",
                        description: "Loading took too long. Please try again.",
                        variant: "destructive",
                    });
                }
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [loading, user, id]);

    // Form state
    const [formData, setFormData] = useState({
        eventType: "",
        eventName: "",
        hostNames: "",
        description: "",
        startDate: "",
        startTime: "",
        venueName: "",
        venueAddress: "",
        parkingNotes: "",
        dressCode: "",
        status: "draft",
    });

    // ... (keep useEffects)

    const fetchEvent = async () => {
        if (!id) {
            toast({
                title: "Error",
                description: "Invalid event ID",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", id)
                .eq("user_id", user?.id)
                .single();

            if (error) throw error;

            if (!data) {
                toast({
                    title: "Error",
                    description: "Event not found or you don't have permission to edit it.",
                    variant: "destructive",
                });
                navigate("/dashboard");
                return;
            }

            // Parse date and time from start_date
            const startDateTime = new Date(data.start_date);
            const dateStr = startDateTime.toISOString().split("T")[0];
            const timeStr = startDateTime.toTimeString().slice(0, 5);

            setFormData({
                eventType: data.event_type || "",
                eventName: data.event_name || "",
                hostNames: data.host_names || "",
                description: data.description || "",
                startDate: dateStr,
                startTime: timeStr,
                venueName: data.venue_name || "",
                venueAddress: data.venue_address || "",
                parkingNotes: data.parking_notes || "",
                dressCode: data.dress_code || "",
                status: data.status || "draft",
            });
        } catch (error: any) {
            console.error("Error fetching event:", error);
            toast({
                title: "Error",
                description: "Failed to load event details.",
                variant: "destructive",
            });
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.eventType !== "";
            case 2:
                return formData.eventName !== "" && formData.startDate !== "";
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user || !id) return;

        setIsSubmitting(true);

        try {
            // Combine date and time
            const startDateTime = formData.startTime
                ? `${formData.startDate}T${formData.startTime}:00`
                : `${formData.startDate}T12:00:00`;

            const { error } = await supabase
                .from("events")
                .update({
                    event_type: formData.eventType,
                    event_name: formData.eventName,
                    host_names: formData.hostNames || null,
                    description: formData.description || null,
                    start_date: startDateTime,
                    venue_name: formData.venueName || null,
                    venue_address: formData.venueAddress || null,
                    parking_notes: formData.parkingNotes || null,
                    dress_code: formData.dressCode || null,
                    status: formData.status,
                })
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            toast({
                title: "Event Updated!",
                description: "Your event has been successfully updated.",
            });

            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update event",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-3xl">
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
                        <h1 className="text-3xl md:text-4xl font-display font-bold">
                            Edit Event
                        </h1>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2 md:gap-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                                            currentStep >= step.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "ml-2 text-sm hidden sm:inline",
                                            currentStep >= step.id
                                                ? "text-foreground font-medium"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {step.name}
                                    </span>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                "w-8 md:w-16 h-0.5 mx-2 md:mx-4",
                                                currentStep > step.id ? "bg-primary" : "bg-muted"
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="invitation-card p-6 md:p-8">
                        {/* Step 1: Event Type */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                                        What are you celebrating?
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Choose the type of event you're creating an invitation for
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {eventTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => updateFormData("eventType", type.id)}
                                                className={cn(
                                                    "p-4 md:p-6 rounded-xl border-2 transition-all text-center hover:border-primary/50 hover:bg-primary/5",
                                                    formData.eventType === type.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border"
                                                )}
                                            >
                                                <div className="text-3xl md:text-4xl mb-2">{type.emoji}</div>
                                                <span className="text-sm md:text-base font-medium">
                                                    {type.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Basic Info */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                                        Tell us about your event
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Add the essential details for your invitation
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="eventName">Event Name *</Label>
                                        <Input
                                            id="eventName"
                                            placeholder="e.g., Priya & Rahul's Wedding"
                                            value={formData.eventName}
                                            onChange={(e) => updateFormData("eventName", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="hostNames">Host Name(s)</Label>
                                        <Input
                                            id="hostNames"
                                            placeholder="e.g., Sharma & Gupta Family"
                                            value={formData.hostNames}
                                            onChange={(e) => updateFormData("hostNames", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="startDate">Event Date *</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => updateFormData("startDate", e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="startTime">Event Time</Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => updateFormData("startTime", e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Share a heartfelt message with your guests..."
                                            value={formData.description}
                                            onChange={(e) => updateFormData("description", e.target.value)}
                                            className="mt-1 min-h-[100px]"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="status">Event Status</Label>
                                        <div className="flex items-center gap-4 mt-1">
                                            <select
                                                id="status"
                                                value={formData.status}
                                                onChange={(e) => updateFormData("status", e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            >
                                                <option value="draft">Draft (Private)</option>
                                                <option value="published">Published (Accepting RSVPs)</option>
                                                <option value="past">Past Event</option>
                                            </select>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Only published events can accept RSVPs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Venue */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                                        Where's the celebration?
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Help your guests find their way to the venue
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="venueName">Venue Name</Label>
                                        <Input
                                            id="venueName"
                                            placeholder="e.g., The Grand Palace"
                                            value={formData.venueName}
                                            onChange={(e) => updateFormData("venueName", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="venueAddress">Address</Label>
                                        <Textarea
                                            id="venueAddress"
                                            placeholder="Enter the full address"
                                            value={formData.venueAddress}
                                            onChange={(e) => updateFormData("venueAddress", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="parkingNotes">Parking Notes</Label>
                                        <Input
                                            id="parkingNotes"
                                            placeholder="e.g., Valet parking available"
                                            value={formData.parkingNotes}
                                            onChange={(e) => updateFormData("parkingNotes", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="dressCode">Dress Code</Label>
                                        <Input
                                            id="dressCode"
                                            placeholder="e.g., Traditional Indian, Semi-formal"
                                            value={formData.dressCode}
                                            onChange={(e) => updateFormData("dressCode", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>

                            {currentStep < steps.length ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                    className="gap-2"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="gradient"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="gap-2"
                                >
                                    {isSubmitting ? "Updating..." : "Update Event"}
                                    <Sparkles className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
