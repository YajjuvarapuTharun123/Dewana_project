import { useEffect, useRef } from 'react';

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

        if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        // Function to check and send notifications
        const checkEventNotifications = () => {
            const now = new Date();

            events.forEach((event) => {
                const eventDate = new Date(event.start_date);
                const timeDiff = eventDate.getTime() - now.getTime();
                const minutesUntilEvent = Math.floor(timeDiff / (1000 * 60));

                // Only notify for events happening in the next 60 minutes
                if (minutesUntilEvent > 0 && minutesUntilEvent <= 60) {
                    const notificationKey = `${event.id}-${minutesUntilEvent}`;

                    // Don't repeat the same notification
                    if (!notifiedEvents.current.has(notificationKey)) {
                        notifiedEvents.current.add(notificationKey);

                        // Create notification
                        const notification = new Notification(`🎉 ${event.event_name}`, {
                            body: minutesUntilEvent <= 1
                                ? 'Starting now!'
                                : `Starts in ${minutesUntilEvent} minute${minutesUntilEvent > 1 ? 's' : ''}!`,
                            icon: '/logo.png',
                            tag: event.id,
                        });

                        // Close notification after 10 seconds
                        setTimeout(() => notification.close(), 10000);
                    }
                }
            });
        };

        // Check immediately
        checkEventNotifications();

        // Check every minute
        intervalRef.current = setInterval(checkEventNotifications, 60 * 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [events]);

    // Clear old notification keys periodically
    useEffect(() => {
        const cleanup = setInterval(() => {
            notifiedEvents.current.clear();
        }, 60 * 60 * 1000); // Clear every hour

        return () => clearInterval(cleanup);
    }, []);
}
