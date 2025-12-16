import React from 'react';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import posthog from '../lib/analytics';

export function PostHogProvider({ children }) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
}
