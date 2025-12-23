import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
    deferredPrompt: any;
    showInstallPrompt: () => Promise<void>;
    isInstalled: boolean;
    isIOS: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if event was already captured globally (prevents race condition)
        if ((window as any).deferredPrompt) {
            console.log("PWAContext: Found existing global deferredPrompt");
            setDeferredPrompt((window as any).deferredPrompt);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e; // Sync global
            console.log("PWAContext: install prompt captured");
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            setIsInstalled(true);
            setDeferredPrompt(null);
            (window as any).deferredPrompt = null;
        });

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);
        if (isIosDevice) {
            console.log("PWAContext: iOS device detected");
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const showInstallPrompt = async () => {
        if (!deferredPrompt) {
            if (isIOS) {
                // iOS manual instruction logic handled by components consuming this
                return;
            }
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            (window as any).deferredPrompt = null;
        }
    };

    return (
        <PWAContext.Provider value={{ deferredPrompt, showInstallPrompt, isInstalled, isIOS }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};
