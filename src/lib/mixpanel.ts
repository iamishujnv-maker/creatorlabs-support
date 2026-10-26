'use client';

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN =
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '3fb07e2aa9352378720b817e9c5f3df6';

let isInitialized = false;
let activeIdentifier: string | null = null;
let activeIdentifierType: 'phone' | 'email' | null = null;

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

/**
 * Register user identifier (phone or email) as Mixpanel Super Properties & User Profile
 * This guarantees the phone/email is automatically attached to EVERY subsequent event
 */
export function setUserIdentifier(identifier: string, isEmail: boolean): void {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    initMixpanel();
  }

  activeIdentifier = identifier;
  activeIdentifierType = isEmail ? 'email' : 'phone';

  try {
    // 1. Identify distinct user so Mixpanel's Distinct ID column shows the phone number / email
    mixpanel.identify(identifier);

    // 2. Register super properties so all future events include phone_number / email
    const superProps: Record<string, any> = {
      user_identifier: identifier,
      identifier_type: isEmail ? 'email' : 'phone',
    };
    if (isEmail) {
      superProps.email = identifier;
    } else {
      superProps.phone_number = identifier;
      superProps.phone = identifier;
    }
    mixpanel.register(superProps);

    // 3. Set Mixpanel user profile traits
    const traits: Record<string, any> = {
      $name: identifier,
      identifier_type: isEmail ? 'email' : 'phone',
      last_seen: new Date().toISOString(),
    };
    if (isEmail) {
      traits.$email = identifier;
      traits.email = identifier;
    } else {
      traits.$phone = identifier;
      traits.phone_number = identifier;
      traits.phone = identifier;
    }
    mixpanel.people.set(traits);
  } catch (err) {
    console.warn('[Mixpanel] Failed to set user identifier:', err);
  }
}

/**
 * Track an event, automatically merging active identifier if present
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    initMixpanel();
  }

  try {
    const enrichedProps = {
      ...(activeIdentifier
        ? {
            user_identifier: activeIdentifier,
            identifier_type: activeIdentifierType,
            ...(activeIdentifierType === 'email'
              ? { email: activeIdentifier }
              : { phone_number: activeIdentifier, phone: activeIdentifier }),
          }
        : {}),
      ...properties,
    };
    mixpanel.track(eventName, enrichedProps);
  } catch (err) {
    console.warn(`[Mixpanel] Failed to track ${eventName}:`, err);
  }
}

export function resetMixpanelUser(): void {
  activeIdentifier = null;
  activeIdentifierType = null;
  if (typeof window === 'undefined' || !isInitialized) return;
  try {
    mixpanel.reset();
  } catch (err) {
    console.warn('[Mixpanel] Failed to reset user:', err);
  }
}

export { mixpanel };
