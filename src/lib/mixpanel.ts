'use client';

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN =
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '3fb07e2aa9352378720b817e9c5f3df6';

let isInitialized = false;

export function initMixpanel(): void {
  if (typeof window === 'undefined' || isInitialized) return;

  if (MIXPANEL_TOKEN) {
    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV !== 'production',
        track_pageview: false,
        persistence: 'localStorage',
        ignore_dnt: true,
      });
      isInitialized = true;
    } catch (err) {
      console.warn('[Mixpanel] Failed to initialize:', err);
    }
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    initMixpanel();
  }

  try {
    mixpanel.track(eventName, properties);
  } catch (err) {
    console.warn(`[Mixpanel] Failed to track ${eventName}:`, err);
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    initMixpanel();
  }

  try {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  } catch (err) {
    console.warn('[Mixpanel] Failed to identify user:', err);
  }
}

export { mixpanel };
