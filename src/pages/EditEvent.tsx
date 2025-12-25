import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    PartyPopper,
    Cake,
    Flame,
    GraduationCap,
    Baby,
    Briefcase,
    Sparkles,
    Plus,
    Trash2,
    Image as ImageIcon,
    Loader2
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

interface SubEvent {
    id?: string;
    name: string;
    date: string;
    time: string;
    location: string;
}

interface SocialLink {
    platform: string;
    url: string;
}

export default function EditEvent() {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

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
        youtubeLink: "",
        googlePhotosUrl: "",
        googleDriveUrl: "",
        status: "draft",
    });

    const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    // Fetch event data
    useEffect(() => {
        if (user && id) {
            fetchEvent();
        }
    }, [user, id]);

    const fetchEvent = async () => {
        if (!id || !user) return;

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from("events")
                .select("*, sub_events(*)")
                .eq("id", id)
                .single();

            if (error) throw error;

            if (!data) {
                toast({
                    title: "Event not found",
                    description: "Could not find the event details.",
                    variant: "destructive",
                });
                return;
            }

            // Parse date and time
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
                youtubeLink: data.youtube_link || "",
                googlePhotosUrl: data.google_photos_url || "",
                googleDriveUrl: data.google_drive_url || "",
                status: data.status || "draft",
            });

            setCoverImageUrl(data.cover_image_url);

            // Parse Social Links
            if (Array.isArray(data.custom_social_links)) {
                setSocialLinks(data.custom_social_links as any);
            } else if (data.custom_social_links) {
                // Backward compatibility if it was an object previously
                const links: SocialLink[] = [];
                const sl = data.custom_social_links as any;
                if (sl.instagram_url) links.push({ platform: "Instagram", url: sl.instagram_url });
                setSocialLinks(links);
            }

            // Parse Sub Events
            if (data.sub_events) {
                const mappedSubEvents = data.sub_events.map((se: any) => {
                    const dt = new Date(se.date_time);
                    return {
                        id: se.id,
                        name: se.name,
                        date: dt.toISOString().split("T")[0],
                        time: dt.toTimeString().slice(0, 5),
                        location: se.location_name || ""
                    };
                });
                setSubEvents(mappedSubEvents);
            }

        } catch (error: any) {
            console.error("Error fetching event:", error);
            toast({
                title: "Loading Error",
                description: "Failed to load event. Please check your connection.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddSubEvent = () => {
        setSubEvents([...subEvents, { name: "", date: "", time: "", location: "" }]);
    };

    const updateSubEvent = (index: number, field: keyof SubEvent, value: string) => {
        const newSubEvents = [...subEvents];
        // @ts-ignore
        newSubEvents[index][field] = value;
        setSubEvents(newSubEvents);
    };

    const removeSubEvent = async (index: number) => {
        const eventToRemove = subEvents[index];
        if (eventToRemove.id) {
            // Delete from DB immediately
            const { error } = await supabase.from('sub_events').delete().eq('id', eventToRemove.id);
            if (error) {
                toast({ title: "Error", description: "Failed to delete sub-event", variant: "destructive" });
                return;
            }
        }
        setSubEvents(subEvents.filter((_, i) => i !== index));
    };

    const handleAddSocialLink = () => {
        if (socialLinks.length >= 5) {
            toast({ title: "Limit Reached", description: "You can add up to 5 social links.", variant: "destructive" });
            return;
        }
        setSocialLinks([...socialLinks, { platform: "Instagram", url: "" }]);
    };

    const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = value;
        setSocialLinks(newLinks);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user || !id) return;

        setIsSubmitting(true);

        try {
            // 1. Upload Cover Photo if changed
            let finalCoverUrl = coverImageUrl;
            if (coverFile) {
                const fileExt = coverFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('event-covers')
                    .upload(filePath, coverFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('event-covers')
                        .getPublicUrl(filePath);
                    finalCoverUrl = publicUrl;
                }
            }

            // 2. Update Event
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
                    youtube_link: formData.youtubeLink || null,
                    custom_social_links: socialLinks as any,
                    google_photos_url: formData.googlePhotosUrl || null,
                    google_drive_url: formData.googleDriveUrl || null,
                    cover_image_url: finalCoverUrl,
                    status: formData.status,
                })
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            // 3. Update Sub-events (Upsert)
            // Separate new and existing
            const subEventsToUpsert = subEvents.map(se => ({
                id: se.id, // If present, it updates
                event_id: id,
                name: se.name,
                date_time: se.time ? `${se.date}T${se.time}:00` : `${se.date}T12:00:00`,
                location_name: se.location,
            }));

            // We need to handle IDs carefully. Upsert works if ID is present.
            // If ID is undefined, Supabase treats it as new row? No, upsert needs PK.
            // Actually, if we pass undefined ID for new rows, we shouldn't include 'id' key in the object or set it to undefined.
            // But types might complain.

            // Clean the array for insert/upsert
            const cleanSubEvents = subEventsToUpsert.map(se => {
                if (!se.id) {
                    const { id, ...rest } = se;
                    return rest;
                }
                return se;
            });

            if (cleanSubEvents.length > 0) {
                const { error: subEventError } = await supabase
                    .from('sub_events')
                    .upsert(cleanSubEvents);

                if (subEventError) console.error("Error updating subevents", subEventError);
            }

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
        <div className="min-h-screen bg-background flex flex-col relative">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-3xl">
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

                    <div className="invitation-card p-6 md:p-8 space-y-8">
                        {/* Event Type */}
                        <section>
                            <Label className="text-lg font-semibold mb-4 block">Event Type *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {eventTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => updateFormData("eventType", type.id)}
                                        className={cn(
                                            "p-3 rounded-lg border text-center transition-all hover:bg-muted",
                                            formData.eventType === type.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                        )}
                                    >
                                        <div className="text-2xl mb-1">{type.emoji}</div>
                                        <div className="text-sm font-medium">{type.name}</div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* Basic Info */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Basic Details</h2>

                            <div>
                                <Label htmlFor="eventName">Event Name *</Label>
                                <Input
                                    id="eventName"
                                    placeholder="e.g., Priya & Rahul's Wedding"
                                    value={formData.eventName}
                                    onChange={(e) => updateFormData("eventName", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="hostNames">Host Name(s)</Label>
                                <Input
                                    id="hostNames"
                                    placeholder="e.g., Sharma & Gupta Family"
                                    value={formData.hostNames}
                                    onChange={(e) => updateFormData("hostNames", e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate">Event Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => updateFormData("startDate", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="startTime">Event Time</Label>
                                    <TimePicker
                                        id="startTime"
                                        value={formData.startTime}
                                        onChange={(value) => updateFormData("startTime", value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Welcome Message / Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Share a heartfelt message with your guests..."
                                    value={formData.description}
                                    onChange={(e) => updateFormData("description", e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="status">Event Status</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => updateFormData("status", e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                                >
                                    <option value="draft">Draft (Private)</option>
                                    <option value="published">Published (Accepting RSVPs)</option>
                                    <option value="past">Past Event</option>
                                </select>
                            </div>
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* Venue */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Venue Details</h2>
                            <div>
                                <Label htmlFor="venueName">Venue Name</Label>
                                <Input
                                    id="venueName"
                                    placeholder="e.g., The Grand Palace"
                                    value={formData.venueName}
                                    onChange={(e) => updateFormData("venueName", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="venueAddress">Address</Label>
                                <Textarea
                                    id="venueAddress"
                                    placeholder="Enter the full address"
                                    value={formData.venueAddress}
                                    onChange={(e) => updateFormData("venueAddress", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dressCode">Dress Code</Label>
                                <Input
                                    id="dressCode"
                                    placeholder="e.g., Traditional"
                                    value={formData.dressCode}
                                    onChange={(e) => updateFormData("dressCode", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="parkingNotes">Parking Notes</Label>
                                <Input
                                    id="parkingNotes"
                                    placeholder="Valet available..."
                                    value={formData.parkingNotes}
                                    onChange={(e) => updateFormData("parkingNotes", e.target.value)}
                                />
                            </div>
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* Sub Events */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Sub-Events</h2>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSubEvent}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Function
                                </Button>
                            </div>

                            {subEvents.map((event, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-muted/20 space-y-3 relative">
                                    <button
                                        onClick={() => removeSubEvent(index)}
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label>Function Name</Label>
                                            <Input
                                                value={event.name}
                                                onChange={(e) => updateSubEvent(index, "name", e.target.value)}
                                                placeholder="e.g. Sangeet"
                                            />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={event.location}
                                                onChange={(e) => updateSubEvent(index, "location", e.target.value)}
                                                placeholder="Venue Name"
                                            />
                                        </div>
                                        <div>
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={event.date}
                                                onChange={(e) => updateSubEvent(index, "date", e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Time</Label>
                                            <TimePicker
                                                value={event.time}
                                                onChange={(val) => updateSubEvent(index, "time", val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* Media & Links */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Media & Links</h2>

                            <div className="space-y-4">
                                {/* Cover Photo */}
                                <div>
                                    <Label className="block mb-2">Cover Photo</Label>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="relative overflow-hidden"
                                        >
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
                                                }}
                                            />
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            {coverFile ? "Change Photo" : (coverImageUrl ? "Change Photo" : "Upload Photo")}
                                        </Button>
                                        {coverFile ? (
                                            <span className="text-sm text-green-600 truncate max-w-[200px]">{coverFile.name}</span>
                                        ) : coverImageUrl && (
                                            <a href={coverImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">View Current Photo</a>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Displayed at the top of your invitation.</p>
                                </div>

                                <div>
                                    <Label htmlFor="youtubeLink">YouTube Video URL</Label>
                                    <Input
                                        id="youtubeLink"
                                        placeholder="https://youtu.be/..."
                                        value={formData.youtubeLink}
                                        onChange={(e) => updateFormData("youtubeLink", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="googlePhotosUrl">Google Photos Album</Label>
                                    <Input
                                        id="googlePhotosUrl"
                                        placeholder="https://photos.app.goo.gl/..."
                                        value={formData.googlePhotosUrl}
                                        onChange={(e) => updateFormData("googlePhotosUrl", e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Social Links */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Social Account Links (Max 5)</h2>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSocialLink}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Link
                                </Button>
                            </div>

                            {socialLinks.map((link, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="w-1/3">
                                        <Label>Platform</Label>
                                        <Input
                                            value={link.platform}
                                            onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                                            placeholder="e.g. Instagram"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label>URL</Label>
                                        <Input
                                            value={link.url}
                                            onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </section>

                        <div className="pt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Event...
                                    </>
                                ) : (
                                    "Update Event"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
