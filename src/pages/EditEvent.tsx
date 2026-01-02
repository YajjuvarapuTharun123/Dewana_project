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
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
    Loader2,
    Save,
    Calendar,
    MapPin,
    Clock,
    Link as LinkIcon,
    Instagram,
    Video
} from "lucide-react";
import { cn } from "@/lib/utils";

const eventTypes = [
    { id: "wedding", name: "Wedding", emoji: "🎊", icon: PartyPopper },
    { id: "birthday", name: "Birthday", emoji: "🎂", icon: Cake },
    { id: "festival", name: "Festival", emoji: "🪔", icon: Flame },
    { id: "graduation", name: "Graduation", emoji: "🎓", icon: GraduationCap },
    { id: "baby-shower", name: "Baby Shower", emoji: "👶", icon: Baby },
    { id: "corporate", name: "Corporate", emoji: "💼", icon: Briefcase },
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

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

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
            if (!data) return;

            const startDateTime = new Date(data.start_date);
            setFormData({
                eventType: data.event_type || "",
                eventName: data.event_name || "",
                hostNames: data.host_names || "",
                description: data.description || "",
                startDate: startDateTime.toISOString().split("T")[0],
                startTime: startDateTime.toTimeString().slice(0, 5),
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

            if (Array.isArray(data.custom_social_links)) {
                setSocialLinks(data.custom_social_links as any);
            } else if (data.custom_social_links) {
                const links: SocialLink[] = [];
                const sl = data.custom_social_links as any;
                if (sl.instagram_url) links.push({ platform: "Instagram", url: sl.instagram_url });
                setSocialLinks(links);
            }

            if (data.sub_events) {
                setSubEvents(data.sub_events.map((se: any) => {
                    const dt = new Date(se.date_time);
                    return {
                        id: se.id,
                        name: se.name,
                        date: dt.toISOString().split("T")[0],
                        time: dt.toTimeString().slice(0, 5),
                        location: se.location_name || ""
                    };
                }));
            }
        } catch (error) {
            console.error("Error fetching event:", error);
            toast({ title: "Error", description: "Failed to load event details.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !id) return;
        setIsSubmitting(true);

        try {
            let finalCoverUrl = coverImageUrl;
            if (coverFile) {
                const fileExt = coverFile.name.split('.').pop();
                const filePath = `${user.id}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('event-covers').upload(filePath, coverFile);
                if (!uploadError) {
                    const { data } = supabase.storage.from('event-covers').getPublicUrl(filePath);
                    finalCoverUrl = data.publicUrl;
                }
            }

            const startDateTime = formData.startTime ? `${formData.startDate}T${formData.startTime}:00` : `${formData.startDate}T12:00:00`;

            const { error } = await supabase.from("events").update({
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
            }).eq("id", id);

            if (error) throw error;

            // Handle sub-events
            const subEventsToUpsert = subEvents.map(se => ({
                id: se.id,
                event_id: id,
                name: se.name,
                date_time: se.time ? `${se.date}T${se.time}:00` : `${se.date}T12:00:00`,
                location_name: se.location,
            })).map(se => {
                if (!se.id) {
                    const { id, ...rest } = se;
                    return rest;
                }
                return se;
            });

            if (subEventsToUpsert.length > 0) {
                await supabase.from('sub_events').upsert(subEventsToUpsert);
            }

            toast({ title: "Success!", description: "Event updated successfully." });
            navigate("/dashboard");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <Navbar />
            <main className="flex-1 pt-24 pb-20 container mx-auto px-4 max-w-4xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-bold">Edit Event</h1>
                            <p className="text-muted-foreground">Update your event details</p>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl border-white/10">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Sparkles className="h-5 w-5" />
                            <h2 className="font-heading font-semibold text-lg">Event Basics</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label className="mb-3 block">Event Type</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                    {eventTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, eventType: type.id })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-sm gap-2",
                                                formData.eventType === type.id
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-surface border-border/50 hover:bg-muted"
                                            )}
                                        >
                                            <span className="text-2xl">{type.emoji}</span>
                                            <span className="font-medium truncate w-full text-center">{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Label>Event Name</Label>
                                <Input value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} className="text-lg font-medium" />
                            </div>

                            <div>
                                <Label>Date</Label>
                                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <Label>Time</Label>
                                <TimePicker value={formData.startTime} onChange={val => setFormData({ ...formData, startTime: val })} />
                            </div>

                            <div className="md:col-span-2">
                                <Label>Host Names</Label>
                                <Input value={formData.hostNames} onChange={e => setFormData({ ...formData, hostNames: e.target.value })} placeholder="Hosts" />
                            </div>

                            <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[100px]" />
                            </div>
                        </div>
                    </div>

                    {/* Venue */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl border-white/10">
                        <div className="flex items-center gap-2 mb-6 text-secondary">
                            <MapPin className="h-5 w-5" />
                            <h2 className="font-heading font-semibold text-lg">Venue & Location</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Venue Name</Label>
                                <Input value={formData.venueName} onChange={e => setFormData({ ...formData, venueName: e.target.value })} />
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Textarea value={formData.venueAddress} onChange={e => setFormData({ ...formData, venueAddress: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Dress Code</Label>
                                    <Input value={formData.dressCode} onChange={e => setFormData({ ...formData, dressCode: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Parking Notes</Label>
                                    <Input value={formData.parkingNotes} onChange={e => setFormData({ ...formData, parkingNotes: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub Events */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-accent">
                                <Calendar className="h-5 w-5" />
                                <h2 className="font-heading font-semibold text-lg">Itinerary / Sub-events</h2>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setSubEvents([...subEvents, { name: "", date: formData.startDate, time: "", location: "" }])}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {subEvents.map((sub, idx) => (
                                <div key={idx} className="p-4 bg-muted/20 border rounded-xl relative group">
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={async () => {
                                        if (sub.id) {
                                            await supabase.from('sub_events').delete().eq('id', sub.id);
                                        }
                                        setSubEvents(subEvents.filter((_, i) => i !== idx));
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div><Label>Name</Label><Input value={sub.name} onChange={e => { const n = [...subEvents]; n[idx].name = e.target.value; setSubEvents(n) }} placeholder="Ceremony Name" /></div>
                                        <div><Label>Location</Label><Input value={sub.location} onChange={e => { const n = [...subEvents]; n[idx].location = e.target.value; setSubEvents(n) }} placeholder="Location" /></div>
                                        <div><Label>Date</Label><Input type="date" value={sub.date} onChange={e => { const n = [...subEvents]; n[idx].date = e.target.value; setSubEvents(n) }} /></div>
                                        <div><Label>Time</Label><TimePicker value={sub.time} onChange={val => { const n = [...subEvents]; n[idx].time = val; setSubEvents(n) }} /></div>
                                    </div>
                                </div>
                            ))}
                            {subEvents.length === 0 && <p className="text-center text-muted-foreground italic py-4">No sub-events added yet.</p>}
                        </div>
                    </div>

                    {/* Media & Links */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl border-white/10">
                        <div className="flex items-center gap-2 mb-6 text-brand-gold">
                            <ImageIcon className="h-5 w-5" />
                            <h2 className="font-heading font-semibold text-lg">Media & Links</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <Label className="block mb-2">Cover Image</Label>
                                <div className="flex items-center gap-4">
                                    {coverImageUrl && <img src={coverImageUrl} className="h-16 w-16 object-cover rounded-lg border" alt="Cover" />}
                                    <Input type="file" onChange={e => e.target.files?.[0] && setCoverFile(e.target.files[0])} accept="image/*" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="flex items-center gap-2 mb-2"><Video className="h-4 w-4" /> YouTube Link</Label>
                                    <Input value={formData.youtubeLink} onChange={e => setFormData({ ...formData, youtubeLink: e.target.value })} placeholder="https://youtube.com/..." />
                                </div>
                                <div>
                                    <Label className="flex items-center gap-2 mb-2"><ImageIcon className="h-4 w-4" /> Google Photos Album</Label>
                                    <Input value={formData.googlePhotosUrl} onChange={e => setFormData({ ...formData, googlePhotosUrl: e.target.value })} placeholder="https://photos.app.goo.gl/..." />
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-4">
                                    <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram & Social Links</Label>
                                    <Button size="sm" variant="outline" onClick={() => setSocialLinks([...socialLinks, { platform: "Instagram", url: "" }])}><Plus className="h-3 w-3 mr-1" /> Add Link</Button>
                                </div>
                                <div className="space-y-3">
                                    {socialLinks.map((link, idx) => (
                                        <div key={idx} className="flex gap-2 group animate-in fade-in slide-in-from-top-1">
                                            <Input placeholder="Platform" className="w-1/3 h-10" value={link.platform} onChange={e => { const n = [...socialLinks]; n[idx].platform = e.target.value; setSocialLinks(n) }} />
                                            <Input placeholder="URL" className="flex-1 h-10" value={link.url} onChange={e => { const n = [...socialLinks]; n[idx].url = e.target.value; setSocialLinks(n) }} />
                                            <Button size="icon" variant="ghost" className="text-destructive h-10 w-10" onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    {socialLinks.length === 0 && (
                                        <div className="text-center py-4 border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm">
                                            No social links added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 flex justify-center"
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        variant="gradient"
                        size="lg"
                        className="w-full md:w-auto px-12 py-6 text-lg shadow-xl shadow-primary/20 rounded-2xl"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                        Save Changes
                    </Button>
                </motion.div>
            </main>
            <Footer />
        </div >
    );
}
