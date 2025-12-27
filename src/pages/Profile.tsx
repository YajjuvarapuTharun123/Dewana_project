import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Save,
    LogOut,
    Bell,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        // Load from localStorage on init
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dewana_notifications') === 'true';
        }
        return false;
    });
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    // Handle notification toggle
    const handleNotificationToggle = async (checked: boolean) => {
        if (checked) {
            // Request notification permission
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('dewana_notifications', 'true');
                    toast({
                        title: "Notifications Enabled",
                        description: "You will receive reminders for your upcoming events.",
                    });
                } else {
                    toast({
                        title: "Permission Denied",
                        description: "Please allow notifications in your browser settings.",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Not Supported",
                    description: "Notifications are not supported in this browser.",
                    variant: "destructive",
                });
            }
        } else {
            setNotificationsEnabled(false);
            localStorage.setItem('dewana_notifications', 'false');
            toast({
                title: "Notifications Disabled",
                description: "You will not receive event reminders.",
            });
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, name')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    // Use profile data if available, fall back to metadata or parsing full name
                    let first = data.first_name || "";
                    let last = data.last_name || "";

                    if (!first && !last && data.name) {
                        const parts = data.name.split(' ');
                        first = parts[0];
                        last = parts.slice(1).join(' ');
                    } else if (!first && !last && user.user_metadata?.full_name) {
                        const parts = user.user_metadata.full_name.split(' ');
                        first = parts[0];
                        last = parts.slice(1).join(' ');
                    }

                    setFormData({
                        firstName: first,
                        lastName: last,
                        email: user.email || "",
                    });
                } else {
                    // No profile data found, try using metadata directly
                    populateFromMetadata();
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                // Fallback to metadata on error
                populateFromMetadata();
            }
        };

        const populateFromMetadata = () => {
            if (user?.user_metadata?.full_name) {
                const parts = user.user_metadata.full_name.split(' ');
                const first = parts[0];
                const last = parts.slice(1).join(' ');
                setFormData({
                    firstName: first,
                    lastName: last,
                    email: user.email || "",
                });
            } else {
                setFormData(prev => ({ ...prev, email: user.email || "" }));
            }
        };

        fetchProfile();
    }, [user]);

    const getInitials = (first?: string, last?: string) => {
        if (!first && !last) return "U";
        return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    name: fullName,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Update auth metadata
            await supabase.auth.updateUser({
                data: { name: fullName, full_name: fullName },
            });

            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    const joinDate = new Date(user.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-2xl">
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
                            My Profile
                        </h1>
                    </div>

                    {/* Profile Card */}
                    <div className="glass-card invitation-card p-6 md:p-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-8">
                            <Avatar className="h-24 w-24 gradient-border mb-4 shadow-lg">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-2xl font-heading font-semibold">
                                    {getInitials(formData.firstName, formData.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-heading font-semibold">
                                {formData.firstName} {formData.lastName}
                            </h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>

                        {/* Form */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName" className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4" />
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                        placeholder="First Name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName" className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4" />
                                        Last Name
                                    </Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, lastName: e.target.value })
                                        }
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                                    <Mail className="h-4 w-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Email cannot be changed
                                </p>
                            </div>

                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4" />
                                    Member Since
                                </Label>
                                <p className="text-foreground font-medium">{joinDate}</p>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive reminders for upcoming events
                                            </p>
                                            {Notification.permission !== 'default' && (
                                                <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs ${Notification.permission === 'granted'
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    }`}>
                                                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                                    {Notification.permission === 'granted' ? 'Permission Granted' : 'Permission Denied'}
                                                </div>
                                            )}
                                        </div>
                                        <Switch
                                            checked={notificationsEnabled}
                                            onCheckedChange={handleNotificationToggle}
                                        />
                                    </div>
                                    {notificationsEnabled && Notification.permission === 'granted' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Send a test notification
                                                const testNotif = new Notification('🎉 Test Notification', {
                                                    body: 'Notifications are working correctly!',
                                                    icon: '/logo.png',
                                                });
                                                setTimeout(() => testNotif.close(), 5000);
                                                toast({
                                                    title: "Test notification sent!",
                                                    description: "Check your notifications",
                                                });
                                            }}
                                            className="w-full btn-press"
                                        >
                                            Send Test Notification
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                <Button
                                    variant="gradient"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSignOut}
                                    className="flex-1 gap-2 text-destructive hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
