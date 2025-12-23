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
} from "lucide-react";

export default function Profile() {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.user_metadata?.name || user.user_metadata?.full_name || "",
                email: user.email || "",
            });
        }
    }, [user]);

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { name: formData.name, full_name: formData.name },
            });

            if (error) throw error;

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
                    <div className="invitation-card p-6 md:p-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-8">
                            <Avatar className="h-24 w-24 border-4 border-primary/20 mb-4">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-heading">
                                    {getInitials(formData.name || user.email)}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-heading font-semibold">
                                {formData.name || "Your Name"}
                            </h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>

                        {/* Form */}
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4" />
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Enter your full name"
                                />
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
