import posthog from 'posthog-js';

// Determine Environment Variables (support both Vite and Next.js styles just in case)
const apiKey = import.meta.env.NEXT_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY;
const apiHost = import.meta.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let analyticsInstance = null;

if (typeof window !== 'undefined' && apiKey) {
    analyticsInstance = posthog.init(apiKey, {
        api_host: apiHost,
        capture_pageview: false, // We will handle this manually for SPA routing
        loaded: (ph) => {
            if (import.meta.env.DEV) ph.debug();
        },
    });
}

// Export a wrapper to make usage safe even if initialization fails or on server
export const analytics = {
    track: (eventName: string, properties?: Record<string, any>) => {
        if (analyticsInstance) {
            analyticsInstance.capture(eventName, properties);
        }
    },
    identify: (userId: string, traits?: Record<string, any>) => {
        if (analyticsInstance) {
            analyticsInstance.identify(userId, traits);
        }
    },
    reset: () => {
        if (analyticsInstance) {
            analyticsInstance.reset();
        }
    }
};

export default posthog;
