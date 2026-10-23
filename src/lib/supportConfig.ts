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
  SUPPORT_SLA_TEXT: '24–72 hours',
  copy: {
    welcomeGreeting: "Hi there! Welcome to Creator Labs Support.",
    welcomePrompt: "Please enter the 10-digit mobile number or email ID you used during payment. I’ll quickly find your workshop.",
    loadingText: 'Finding your workshop details...',
    liveBannerText: 'Your workshop is live right now!',
    upcomingPrompt: 'How can we help you with your workshop?',
    completedPrompt: 'How can we help you with your workshop?',
    notFoundText: "We couldn’t find any registration with this {identifier}.",
    notFoundRetryPrompt: 'Please try again with a different mobile number or email ID.',
    paymentFailedNote: 'If money was deducted, your bank or UPI will usually refund it back in 5–7 working days.',
    feedbackQuestion: 'Did this solve your problem?',
    escalationText: "Message us on WhatsApp and our team will help you within {sla}. Your booking details are already filled in.",
    closingMessage: 'Glad that helped! Have a great learning experience at your workshop!',
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
