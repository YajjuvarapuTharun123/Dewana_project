import { useState, useEffect } from "react";
import { usePWA } from "@/contexts/PWAContext";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const PWAInstallBanner = () => {
    const { deferredPrompt, showInstallPrompt, isInstalled } = usePWA();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show banner if:
        // 1. Install prompt is captured (deferredPrompt exists)
        // 2. App is NOT installed
        // 3. User hasn't dismissed it previously
        const isDismissed = localStorage.getItem("dewana_pwa_dismissed");

        if (deferredPrompt && !isInstalled && !isDismissed) {
            // Small delay to be less intrusive
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [deferredPrompt, isInstalled]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("dewana_pwa_dismissed", "true");
    };

    const handleInstall = async () => {
        await showInstallPrompt();
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
                >
                    <div className="bg-white/90 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-lg flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Download className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Install Dewana</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Add to home screen for a better experience
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                                onClick={handleDismiss}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleDismiss}
                            >
                                Not Now
                            </Button>
                            <Button
                                variant="gradient"
                                className="flex-1 gap-2"
                                onClick={handleInstall}
                            >
                                <Download className="h-4 w-4" />
                                Install
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
