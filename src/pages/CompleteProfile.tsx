import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

export default function CompleteProfile() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
    });

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter both your first and last name.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    name: fullName,
                })
                .eq("id", user.id);

            if (error) throw error;

            // Also update auth metadata if possible, or just rely on profile
            await supabase.auth.updateUser({
                data: { name: fullName, full_name: fullName }
            });

            toast({
                title: "Profile Updated",
                description: "Welcome to Dewana!",
            });
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pattern-paisley flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="invitation-card p-8 shadow-card animate-scale-in">
                    <div className="flex justify-center mb-8">
                        <Logo />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-display font-bold mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Please tell us your name to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="gradient" className="w-full h-12 mt-6" disabled={submitting}>
                            {submitting ? "Saving..." : "Continue to Dashboard"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
