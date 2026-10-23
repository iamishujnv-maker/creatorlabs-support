import fs from 'fs';
import path from 'path';

export interface SupportConfig {
  LOOKBACK_DAYS: number;
  LIVE_WINDOW_MINUTES: number;
  CENTRAL_SUPPORT_WHATSAPP: string;
  SUPPORT_SLA_TEXT: string;
  copy: {
    welcomeGreeting: string;
    welcomePrompt: string;
    loadingText: string;
    liveBannerText: string;
    upcomingPrompt: string;
    completedPrompt: string;
    notFoundText: string;
    notFoundRetryPrompt: string;
    paymentFailedNote: string;
    feedbackQuestion: string;
    escalationText: string;
    closingMessage: string;
  };
}

export const DEFAULT_SUPPORT_CONFIG: SupportConfig = {
  LOOKBACK_DAYS: 14,
  LIVE_WINDOW_MINUTES: 30,
  CENTRAL_SUPPORT_WHATSAPP: '918949451726',
  SUPPORT_SLA_TEXT: '24–48 hours',
  copy: {
    welcomeGreeting: "Hi! I'm the Creator Lab help assistant.",
    welcomePrompt: "Enter the phone number or email you used to pay. I'll find your workshop.",
    loadingText: 'Looking up your workshops...',
    liveBannerText: 'Your workshop is live right now!',
    upcomingPrompt: 'What do you need help with?',
    completedPrompt: 'What do you need help with?',
    notFoundText: "We couldn't find any registration with this {identifier}.",
    notFoundRetryPrompt: 'Sometimes the booking is saved under your {other} instead. Can you try that?',
    paymentFailedNote: 'If money was deducted, your bank usually returns it in 5–7 working days.',
    feedbackQuestion: 'Did this solve your problem?',
    escalationText: "Message us on WhatsApp and our team will get back to you within {sla}. Your booking details are already in the message.",
    closingMessage: 'Glad that helped! Enjoy your workshop! If anything else comes up, I’m right here.',
  },
};

// Cached in memory for serverless lifetime
let inMemoryConfig: SupportConfig | null = null;
const CONFIG_FILE_PATH = path.join('/tmp', 'creatorlabs_support_config.json');

export function getSupportConfig(): SupportConfig {
  if (inMemoryConfig) {
    return inMemoryConfig;
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const loaded: SupportConfig = { ...DEFAULT_SUPPORT_CONFIG, ...JSON.parse(data) };
      inMemoryConfig = loaded;
      return loaded;
    }
  } catch (err) {
    console.warn('Failed to read config from file, using defaults:', err);
  }

  const fallback: SupportConfig = { ...DEFAULT_SUPPORT_CONFIG };
  inMemoryConfig = fallback;
  return fallback;
}

export function updateSupportConfig(updates: Partial<SupportConfig>): SupportConfig {
  const current = getSupportConfig();
  const merged: SupportConfig = {
    ...current,
    ...updates,
    copy: {
      ...current.copy,
      ...(updates.copy || {}),
    },
  };

  inMemoryConfig = merged;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist config to /tmp, keeping in memory:', err);
  }

  return merged;
}
