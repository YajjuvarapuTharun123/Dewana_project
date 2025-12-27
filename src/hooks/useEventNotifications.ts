import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface Event {
    id: string;
    event_name: string;
    start_date: string;
}

export function useEventNotifications(events: Event[]) {
    const notifiedEvents = useRef<Set<string>>(new Set());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check if notifications are enabled
        const notificationsEnabled = localStorage.getItem('dewana_notifications') === 'true';
        console.log('[Notifications] Enabled:', notificationsEnabled);
        console.log('[Notifications] Permission:', Notification.permission);

        if (!notificationsEnabled) {
            console.log('[Notifications] Notifications disabled by user');
            return;
        }

        if (!('Notification' in window)) {
            console.log('[Notifications] Browser does not support notifications');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return;
        }

        console.log(`[Notifications] Watching ${events.length} events`);

        // Function to check and send notifications
        const checkEventNotifications = () => {
            const now = new Date();
            console.log('[Notifications] Checking events at', now.toLocaleTimeString());

            events.forEach((event) => {
                const eventDate = new Date(event.start_date);
                const timeDiff = eventDate.getTime() - now.getTime();
                const minutesUntilEvent = Math.floor(timeDiff / (1000 * 60));
                const hoursUntilEvent = Math.floor(minutesUntilEvent / 60);

                console.log(`[Notifications] Event "${event.event_name}": ${minutesUntilEvent} min until start`);

                // Notify at 1 hour, 30 min, 15 min, and 1 min before
                const notifyAt = [60, 30, 15, 1];
                const shouldNotify = notifyAt.includes(minutesUntilEvent);

                if (shouldNotify) {
                    const notificationKey = `${event.id}-${minutesUntilEvent}`;

                    // Don't repeat the same notification
                    if (!notifiedEvents.current.has(notificationKey)) {
                        notifiedEvents.current.add(notificationKey);
                        console.log(`[Notifications] Sending notification for "${event.event_name}" (${minutesUntilEvent} min)`);

                        const timeText = minutesUntilEvent >= 60
                            ? `in ${hoursUntilEvent} hour${hoursUntilEvent > 1 ? 's' : ''}`
                            : minutesUntilEvent <= 1
                                ? 'Starting now!'
                                : `in ${minutesUntilEvent} minute${minutesUntilEvent > 1 ? 's' : ''}`;

                        // Create browser notification
                        try {
                            const notification = new Notification(`🎉 ${event.event_name}`, {
                                body: timeText,
                                icon: '/logo.png',
                                tag: event.id,
                                requireInteraction: minutesUntilEvent <= 1, // Keep visible for imminent events
                            });

                            // Close notification after 10 seconds (except for imminent events)
                            if (minutesUntilEvent > 1) {
                                setTimeout(() => notification.close(), 10000);
                            }

                            console.log('[Notifications] Browser notification sent');
                        } catch (error) {
                            console.error('[Notifications] Error creating notification:', error);
                        }

                        // Also show toast as fal back for visibility
                        toast({
                            title: `🎉 ${event.event_name}`,
                            description: timeText,
                            duration: 8000,
                        });
                    }
                }
            });
        };

        // Check immediately
        checkEventNotifications();

        // Check every minute
        console.log('[Notifications] Setting up interval check (every 60s)');
        intervalRef.current = setInterval(checkEventNotifications, 60 * 1000);

        return () => {
            if (intervalRef.current) {
                console.log('[Notifications] Cleaning up interval');
                clearInterval(intervalRef.current);
            }
        };
    }, [events]);

    // Clear old notification keys periodically
    useEffect(() => {
        const cleanup = setInterval(() => {
            console.log('[Notifications] Clearing old notification keys');
            notifiedEvents.current.clear();
        }, 60 * 60 * 1000); // Clear every hour

        return () => clearInterval(cleanup);
    }, []);
}
