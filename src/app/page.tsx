'use client';

import React, { useState, useRef, useEffect } from 'react';
import './chat-assistant.css';
import {
  Video,
  MessageSquare,
  Clock,
  Calendar,
  IndianRupee,
  Lock,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Mail,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Check,
  CreditCard,
  RotateCcw,
  ArrowUp,
} from 'lucide-react';
import {
  PaidWorkshopItem,
  AttemptedWorkshopItem,
  SupportLookupResult,
} from '@/lib/supportService';

type Step =
  | 'WELCOME'
  | 'LOOKING_UP'
  | 'WORKSHOPS_LIST'
  | 'LIVE_NOW_HIGHLIGHT'
  | 'ISSUE_SELECT'
  | 'RESOLUTION_CTA'
  | 'RESOLUTION_NO_CTA'
  | 'CREATOR_CONTACT'
  | 'ATTEMPTED_LIST'
  | 'NOT_FOUND_FIRST'
  | 'ESCALATION'
  | 'SUCCESS_CLOSING';

export type ChatFeedItem =
  | {
      id: string;
      kind: 'bot_welcome';
    }
  | {
      id: string;
      kind: 'user_message';
      text: string;
      subtext?: string;
      time: string;
    }
  | {
      id: string;
      kind: 'bot_typing';
    }
  | {
      id: string;
      kind: 'attempted_list';
      attempts: AttemptedWorkshopItem[];
      answered?: 'yes' | 'no' | boolean | null;
    }
  | {
      id: string;
      kind: 'workshops_list';
      workshops: PaidWorkshopItem[];
      isEmail: boolean;
      answered?: boolean | 'yes' | 'no' | null;
    }
  | {
      id: string;
      kind: 'live_now_highlight';
      workshop: PaidWorkshopItem;
      answered?: boolean | 'yes' | 'no' | null;
    }
  | {
      id: string;
      kind: 'issue_select';
      workshop: PaidWorkshopItem;
      answered?: boolean | 'yes' | 'no' | null;
    }
  | {
      id: string;
      kind: 'resolution_cta';
      messages: string[];
      ctaLink: string | null;
      ctaText: string;
      answered?: 'yes' | 'no' | boolean | null;
    }
  | {
      id: string;
      kind: 'resolution_no_cta';
      messages: string[];
      workshop: PaidWorkshopItem;
      answered?: boolean | 'yes' | 'no' | null;
    }
  | {
      id: string;
      kind: 'creator_contact';
      workshop: PaidWorkshopItem;
      answered?: boolean | 'yes' | 'no' | null;
    }
  | {
      id: string;
      kind: 'not_found_first';
      query: string;
    }
  | {
      id: string;
      kind: 'escalation';
      reason?: string;
    }
  | {
      id: string;
      kind: 'success_closing';
      customerName?: string;
    };

export default function SupportAssistantPage() {
  const [step, setStep] = useState<Step>('WELCOME');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // History & Session Data
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isEmailLookup, setIsEmailLookup] = useState<boolean>(false);

  // Results & Context
  const [workshops, setWorkshops] = useState<PaidWorkshopItem[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<PaidWorkshopItem | null>(null);
  const [attemptedOrders, setAttemptedOrders] = useState<AttemptedWorkshopItem[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<string>('');

  // Config
  const [centralWhatsApp, setCentralWhatsApp] = useState<string>('918949451726');
  const [supportSlaText, setSupportSlaText] = useState<string>('24–72 hours');

  // Unified chronological chat message stream
  const [chatFeed, setChatFeed] = useState<ChatFeedItem[]>([
    { id: 'welcome', kind: 'bot_welcome' },
  ]);

  const getCurrentTime = () => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatFeed, step]);

  // Reset to initial state
  const handleReset = () => {
    setStep('WELCOME');
    setInputValue('');
    setInputError(null);
    setCurrentQuery('');
    setWorkshops([]);
    setSelectedWorkshop(null);
    setAttemptedOrders([]);
    setSelectedIssue('');
    setChatFeed([{ id: 'welcome', kind: 'bot_welcome' }]);
  };

  // Validate Phone / Email with strict format checks & user-friendly error copy
  const validateInput = (
    val: string,
    expectedType: 'phone' | 'email' | 'any' = 'any'
  ): { valid: boolean; isEmail: boolean; error?: string; cleaned: string } => {
    const cleaned = val.replace(/\s+/g, '');
    if (!cleaned) {
      return {
        valid: false,
        isEmail: false,
        error:
          expectedType === 'email'
            ? 'Please enter your email ID to proceed.'
            : expectedType === 'phone'
            ? 'Please enter your 10-digit mobile number to proceed.'
            : 'Please enter your 10-digit mobile number or email ID.',
        cleaned: '',
      };
    }

    const hasAt = cleaned.includes('@');
    const hasLetters = /[a-zA-Z]/.test(cleaned);

    if (expectedType === 'phone') {
      if (hasAt || hasLetters) {
        return {
          valid: false,
          isEmail: false,
          error: 'Please enter numbers only (without @ or letters) for your mobile number.',
          cleaned,
        };
      }
    } else if (expectedType === 'email') {
      if (!hasAt && !hasLetters) {
        return {
          valid: false,
          isEmail: true,
          error: 'Please enter a complete email ID (e.g. name@gmail.com).',
          cleaned,
        };
      }
    }

    const treatAsEmail = expectedType === 'email' || (expectedType === 'any' && (hasAt || hasLetters));

    if (treatAsEmail) {
      if (!cleaned.includes('@')) {
        return {
          valid: false,
          isEmail: true,
          error: 'Email ID must include "@" and a domain (e.g. name@gmail.com).',
          cleaned,
        };
      }

      const parts = cleaned.split('@');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return {
          valid: false,
          isEmail: true,
          error: 'Please enter a complete email address (e.g. name@gmail.com).',
          cleaned,
        };
      }

      const [username, domain] = parts;
      if (!domain.includes('.')) {
        return {
          valid: false,
          isEmail: true,
          error: 'Please include a valid domain extension like .com or .in (e.g. gmail.com).',
          cleaned,
        };
      }

      const domainParts = domain.split('.');
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        return {
          valid: false,
          isEmail: true,
          error: 'Please enter a valid email domain ending in .com, .in, etc.',
          cleaned,
        };
      }

      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(cleaned)) {
        return {
          valid: false,
          isEmail: true,
          error: 'Please enter a valid email address (e.g. name@gmail.com, name@yahoo.com).',
          cleaned: cleaned.toLowerCase(),
        };
      }

      return { valid: true, isEmail: true, cleaned: cleaned.toLowerCase() };
    }

    // Phone checks
    const digitsOnly = cleaned.replace(/\D/g, '');

    let core10 = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      core10 = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      core10 = digitsOnly.slice(1);
    }

    if (core10.length < 10) {
      return {
        valid: false,
        isEmail: false,
        error: `Mobile number has only ${core10.length} digit${core10.length === 1 ? '' : 's'}. Please enter all 10 digits.`,
        cleaned: core10,
      };
    }

    if (core10.length > 10) {
      return {
        valid: false,
        isEmail: false,
        error: 'Please enter a 10-digit mobile number (e.g. 9876543210).',
        cleaned: core10,
      };
    }

    if (!/^[6-9]\d{9}$/.test(core10)) {
      return {
        valid: false,
        isEmail: false,
        error: 'Indian mobile numbers start with 6, 7, 8, or 9. Please verify and try again.',
        cleaned: core10,
      };
    }

    return { valid: true, isEmail: false, cleaned: core10 };
  };

  // Perform Lookup
  const executeLookup = async (queryToSearch: string, isSecondTry = false) => {
    setInputError(null);
    const validation = validateInput(queryToSearch, 'any');
    if (!validation.valid) {
      setInputError(validation.error || 'Please enter a valid mobile number or email ID.');
      return;
    }

    const cleanDisplay = validation.cleaned;
    const timeNow = getCurrentTime();

    setCurrentQuery(cleanDisplay);
    setIsEmailLookup(validation.isEmail);
    setInputValue('');

    // Append user message + typing indicator to chat feed
    setChatFeed((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, kind: 'user_message', text: cleanDisplay, time: timeNow },
      { id: 'typing', kind: 'bot_typing' },
    ]);

    setStep('LOOKING_UP');

    try {
      const [res] = await Promise.all([
        fetch(`/api/lookup?query=${encodeURIComponent(queryToSearch.trim())}`),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ]);

      const data = await res.json();

      // Remove typing indicator from chat feed
      setChatFeed((prev) => prev.filter((item) => item.kind !== 'bot_typing'));

      if (!data.success || !data.result) {
        if (isSecondTry) {
          triggerEscalation('Registration not found after searching both phone and email');
        } else {
          setChatFeed((prev) => [
            ...prev,
            { id: `not-found-${Date.now()}`, kind: 'not_found_first', query: cleanDisplay },
          ]);
          setStep('NOT_FOUND_FIRST');
        }
        return;
      }

      const lookup: SupportLookupResult = data.result;

      if (lookup.config) {
        if (lookup.config.centralSupportWhatsApp) setCentralWhatsApp(lookup.config.centralSupportWhatsApp);
        if (lookup.config.supportSlaText) setSupportSlaText(lookup.config.supportSlaText);
      }

      // Case routing
      if (lookup.caseType === 'CASE_A') {
        setWorkshops(lookup.workshops);

        const liveNowOrder = lookup.workshops.find((w) => w.statusCategory === 'LIVE_NOW');
        if (liveNowOrder && lookup.workshops.length === 1) {
          setSelectedWorkshop(liveNowOrder);
          setChatFeed((prev) => [
            ...prev,
            { id: `live-${Date.now()}`, kind: 'live_now_highlight', workshop: liveNowOrder },
          ]);
          setStep('LIVE_NOW_HIGHLIGHT');
        } else {
          setChatFeed((prev) => [
            ...prev,
            {
              id: `workshops-${Date.now()}`,
              kind: 'workshops_list',
              workshops: lookup.workshops,
              isEmail: validation.isEmail,
            },
          ]);
          setStep('WORKSHOPS_LIST');
        }
      } else if (lookup.caseType === 'CASE_B') {
        setAttemptedOrders(lookup.attempts);
        setChatFeed((prev) => [
          ...prev,
          {
            id: `attempted-${Date.now()}`,
            kind: 'attempted_list',
            attempts: lookup.attempts,
            answered: null,
          },
        ]);
        setStep('ATTEMPTED_LIST');
      } else {
        // CASE C
        if (isSecondTry) {
          triggerEscalation('Registration not found after phone and email search');
        } else {
          setChatFeed((prev) => [
            ...prev,
            { id: `not-found-${Date.now()}`, kind: 'not_found_first', query: cleanDisplay },
          ]);
          setStep('NOT_FOUND_FIRST');
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setChatFeed((prev) => prev.filter((item) => item.kind !== 'bot_typing'));
      setInputError('Network issue. Please check your connection and try again.');
      setStep('WELCOME');
    }
  };

  // Workshop Selected from Workshops List
  const handleSelectWorkshop = (itemId: string, ws: PaidWorkshopItem) => {
    setSelectedWorkshop(ws);

    // Mark previous list as answered so buttons are settled
    setChatFeed((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, answered: true } : item))
    );

    const subtext = ws.hasWorkshopDate && ws.workshopTimeFormatted
      ? `Workshop: ${ws.workshopTimeFormatted}`
      : `Registered: ${ws.registrationDateFormatted} · Paid ₹${ws.amount}`;

    const timeNow = getCurrentTime();

    if (ws.statusCategory === 'LIVE_NOW') {
      setChatFeed((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, kind: 'user_message', text: ws.brandName, subtext, time: timeNow },
        { id: `live-${Date.now()}`, kind: 'live_now_highlight', workshop: ws },
      ]);
      setStep('LIVE_NOW_HIGHLIGHT');
    } else {
      setChatFeed((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, kind: 'user_message', text: ws.brandName, subtext, time: timeNow },
        { id: `issues-${Date.now()}`, kind: 'issue_select', workshop: ws },
      ]);
      setStep('ISSUE_SELECT');
    }
  };

  // Issue Handlers aligned with business spreadsheet rules
  const handleIssueSelect = (itemId: string, issueKey: string, issueLabel: string) => {
    setSelectedIssue(issueLabel);
    if (!selectedWorkshop) return;

    // Mark issue select as answered
    setChatFeed((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, answered: true } : item))
    );

    const timeNow = getCurrentTime();
    const communityLink = selectedWorkshop.whatsappCommunityLink || 'https://chat.whatsapp.com/';

    switch (issueKey) {
      case 'ZOOM_LINK':
        if (selectedWorkshop.statusCategory === 'LIVE_NOW') {
          setChatFeed((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
            {
              id: `res-${Date.now()}`,
              kind: 'resolution_cta',
              messages: [
                'Your workshop has already started! The Zoom link is pinned right inside the WhatsApp community — tap below to join now.',
              ],
              ctaLink: communityLink,
              ctaText: 'Open WhatsApp Community',
              answered: null,
            },
          ]);
          setStep('RESOLUTION_CTA');
        } else {
          setChatFeed((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
            {
              id: `res-${Date.now()}`,
              kind: 'resolution_cta',
              messages: [
                'The Zoom link is shared exclusively inside the official WhatsApp community a day before the workshop and a few hours prior to the session.',
                'If you’ve already joined the community, please wait — it will be posted directly there!',
              ],
              ctaLink: communityLink,
              ctaText: 'Join WhatsApp Community',
              answered: null,
            },
          ]);
          setStep('RESOLUTION_CTA');
        }
        break;

      case 'WA_COMMUNITY':
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
          {
            id: `res-${Date.now()}`,
            kind: 'resolution_cta',
            messages: [
              `Here is the official WhatsApp community link for ${selectedWorkshop.brandName}.`,
              'All important announcements, meeting links, and session materials are shared directly in this group. Join now so you don’t miss out!',
            ],
            ctaLink: communityLink,
            ctaText:
              selectedWorkshop.statusCategory === 'LIVE_NOW' ? 'Open WhatsApp Community' : 'Join WhatsApp Community',
            answered: null,
          },
        ]);
        setStep('RESOLUTION_CTA');
        break;

      case 'CHANGE_TIMING':
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
          {
            id: `res-${Date.now()}`,
            kind: 'resolution_cta',
            messages: [
              'We’re sorry, but workshop dates and timings cannot be changed or rescheduled once booked.',
              'However, please stay connected in the WhatsApp community so you don’t miss any updates or upcoming session announcements.',
            ],
            ctaLink: communityLink,
            ctaText: 'Join WhatsApp Community',
            answered: null,
          },
        ]);
        setStep('RESOLUTION_CTA');
        break;

      case 'MISSED_WORKSHOP':
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
          {
            id: `res-${Date.now()}`,
            kind: 'resolution_cta',
            messages: [
              'Don’t worry if you couldn’t attend the live session!',
              'Please join the WhatsApp community below to receive workshop highlights, study materials, and details about the next upcoming batch.',
            ],
            ctaLink: communityLink,
            ctaText: 'Join WhatsApp Community',
            answered: null,
          },
        ]);
        setStep('RESOLUTION_CTA');
        break;

      case 'WANT_REFUND':
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
          {
            id: `res-${Date.now()}`,
            kind: 'resolution_no_cta',
            messages: [
              'We understand your concern. However, as per our policy, all workshop fees are non-refundable once registered.',
              `${selectedWorkshop.creatorName} sometimes accommodates participants with session recordings or a seat in the next batch. You can reach out to them directly.`,
            ],
            workshop: selectedWorkshop,
          },
        ]);
        setStep('RESOLUTION_NO_CTA');
        break;

      case 'COURSE_ACCESS':
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
          {
            id: `creator-${Date.now()}`,
            kind: 'creator_contact',
            workshop: selectedWorkshop,
          },
        ]);
        setStep('CREATOR_CONTACT');
        break;

      case 'SOMETHING_ELSE':
      default:
        setChatFeed((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, kind: 'user_message', text: issueLabel, time: timeNow },
        ]);
        triggerEscalation(issueLabel);
        break;
    }
  };

  // Feedback on Case B Attempted Orders ("Yes" or "No")
  const handleAttemptedFeedback = (feedItemId: string, answer: 'yes' | 'no') => {
    setChatFeed((prev) =>
      prev.map((item) =>
        item.id === feedItemId && item.kind === 'attempted_list'
          ? { ...item, answered: answer }
          : item
      )
    );

    const timeNow = getCurrentTime();

    if (answer === 'no') {
      setSelectedIssue('Payment not completed - needs assistance');
      setChatFeed((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          kind: 'user_message',
          text: 'No, I need more help',
          time: timeNow,
        },
        {
          id: `escalation-${Date.now()}`,
          kind: 'escalation',
          reason: 'Payment not completed - needs assistance',
        },
      ]);
      setStep('ESCALATION');
    } else {
      setChatFeed((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          kind: 'user_message',
          text: 'Yes, this solved my problem',
          time: timeNow,
        },
        {
          id: `success-${Date.now()}`,
          kind: 'success_closing',
        },
      ]);
      setStep('SUCCESS_CLOSING');
    }
  };

  // Feedback on Resolution CTA
  const handleResolutionFeedback = (feedItemId: string, answer: 'yes' | 'no') => {
    setChatFeed((prev) =>
      prev.map((item) =>
        item.id === feedItemId && item.kind === 'resolution_cta'
          ? { ...item, answered: answer }
          : item
      )
    );

    const timeNow = getCurrentTime();

    if (answer === 'no') {
      setSelectedIssue('Needs further assistance');
      setChatFeed((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          kind: 'user_message',
          text: 'No, I need more help',
          time: timeNow,
        },
        {
          id: `escalation-${Date.now()}`,
          kind: 'escalation',
          reason: 'Needs further assistance',
        },
      ]);
      setStep('ESCALATION');
    } else {
      setChatFeed((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          kind: 'user_message',
          text: 'Yes, this solved my problem',
          time: timeNow,
        },
        {
          id: `success-${Date.now()}`,
          kind: 'success_closing',
          customerName: selectedWorkshop?.customerName,
        },
      ]);
      setStep('SUCCESS_CLOSING');
    }
  };

  // Trigger Escalation
  const triggerEscalation = (reason?: string) => {
    const finalReason = reason || selectedIssue || 'General Query';
    setSelectedIssue(finalReason);
    setChatFeed((prev) => [
      ...prev,
      {
        id: `escalation-${Date.now()}`,
        kind: 'escalation',
        reason: finalReason,
      },
    ]);
    setStep('ESCALATION');
  };

  // Check other workshops
  const handleCheckOtherWorkshops = () => {
    const timeNow = getCurrentTime();
    setChatFeed((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        kind: 'user_message',
        text: 'Check my other workshops',
        time: timeNow,
      },
      {
        id: `workshops-${Date.now()}`,
        kind: 'workshops_list',
        workshops,
        isEmail: isEmailLookup,
      },
    ]);
    setStep('WORKSHOPS_LIST');
  };

  // Contact creator flow
  const handleContactCreator = () => {
    if (!selectedWorkshop) return;
    const timeNow = getCurrentTime();
    setChatFeed((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        kind: 'user_message',
        text: 'Contact the creator',
        time: timeNow,
      },
      {
        id: `creator-${Date.now()}`,
        kind: 'creator_contact',
        workshop: selectedWorkshop,
      },
    ]);
    setStep('CREATOR_CONTACT');
  };

  // Build WhatsApp Support URL
  const getEscalationWhatsAppUrl = () => {
    let msg = '';
    if (selectedWorkshop) {
      msg = `Hi, I need help with my workshop booking.\nOrder ID: ${selectedWorkshop.orderId}\nWorkshop: ${selectedWorkshop.brandName}\nIssue: ${selectedIssue || 'Support inquiry'}`;
    } else {
      msg = `Hi, I need help finding my workshop registration.\nRegistered ${isEmailLookup ? 'Email' : 'Mobile'}: ${currentQuery}`;
    }

    return `https://wa.me/${centralWhatsApp}?text=${encodeURIComponent(msg)}`;
  };

  // Creator Initials
  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CL'
    );
  };

  const isLiveNow = selectedWorkshop?.statusCategory === 'LIVE_NOW';

  return (
    <div className="chat-app-wrapper">
      <div className="chat-phone-shell">
        {/* Urgent Live Banner (H14) */}
        {isLiveNow && (
          <div className="live-urgent-banner">
            <div>
              <span className="live-pulse-dot" />
              <span>Your workshop is live right now!</span>
            </div>
            <Video size={16} />
          </div>
        )}

        {/* Top Header Bar */}
        <header className="chat-header">
          <div className="chat-header-profile">
            <img
              src="https://r2.creatorlabs.in/public/carnot_workshops/Screenshot_2026-10-23_at_1.42.35_PM-c78b1641-ff02-41e4-bfec-aca811772007.jpg"
              alt="Creator Labs Workshops"
              className="chat-avatar-logo"
              width={40}
              height={40}
              onError={(e) => {
                e.currentTarget.src = '/creatorlabs-logo.jpg';
              }}
            />
            <div className="chat-header-info">
              <span className="chat-header-title">Creator Labs Workshops</span>
              <span className="chat-header-subtitle">
                <span className="status-dot-green" />
                <span>Online • replies in seconds</span>
              </span>
            </div>
          </div>

          {(step !== 'WELCOME' || chatFeed.length > 1) && (
            <button
              type="button"
              onClick={handleReset}
              className="chat-reset-btn"
              title="Start over"
            >
              <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
              <span>Reset</span>
            </button>
          )}
        </header>

        {/* Chat Scroll Area (Unified Chat Message Stream) */}
        <main className="chat-scroll-area" ref={scrollRef}>
          {/* Centered Date Pill */}
          <div className="chat-date-separator">
            <span className="chat-date-text">Today</span>
          </div>

          {/* Render All Chat Feed Items in Chronological Sequence */}
          {chatFeed.map((item) => {
            switch (item.kind) {
              case 'bot_welcome':
                return (
                  <div key={item.id} className="chat-row-bot">
                    <div className="chat-bubble-stack">
                      <div className="chat-bubble-bot">
                        Hi there! Welcome to Creator Labs Support.
                      </div>
                      <div className="chat-bubble-bot">
                        Please enter the 10-digit mobile number or email ID you used during payment. I’ll quickly find your workshop.
                      </div>
                    </div>
                  </div>
                );

              case 'user_message':
                return (
                  <div key={item.id} className="chat-row-user">
                    <div className="chat-bubble-user">
                      <div>{item.text}</div>
                      {item.subtext && (
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                          {item.subtext}
                        </div>
                      )}
                      <div className="chat-user-meta">
                        <span>{item.time || getCurrentTime()}</span>
                        <span>✓</span>
                      </div>
                    </div>
                  </div>
                );

              case 'bot_typing':
                return (
                  <div key={item.id} className="chat-row-bot">
                    <div>
                      <div className="typing-bubble">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                      <div className="typing-subtext">Finding your workshop details...</div>
                    </div>
                  </div>
                );

              case 'attempted_list':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Payment not completed cards */}
                    {item.attempts.map((att) => (
                      <div key={att.orderId} className="attempted-card">
                        <div className="attempted-header">
                          <AlertCircle size={14} />
                          <span>Payment not completed</span>
                        </div>
                        <div className="attempted-body">
                          Your payment didn’t go through. You tried to register for{' '}
                          <strong>{att.brandName}</strong> on {att.domain} but the transaction was not completed.
                        </div>
                        <div className="attempted-meta">{att.triedDateFormatted}</div>
                        <a
                          href={att.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-register-again"
                        >
                          <span>Complete registration</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}

                    {/* Bank deduction info bubble */}
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">
                          If money was debited from your bank account or UPI, don’t worry—banks usually refund failed transactions within 5–7 working days.
                        </div>
                      </div>
                    </div>

                    {/* Did this solve your problem? (Removed once user makes a choice) */}
                    {!item.answered && (
                      <div className="chat-row-bot" style={{ marginTop: 2 }}>
                        <div className="zomato-chat-card">
                          <div className="zomato-card-header">
                            <div className="zomato-card-prompt">Did this solve your problem?</div>
                            <span className="zomato-card-time">{getCurrentTime()}</span>
                          </div>
                          <div className="zomato-options-list">
                            <button
                              type="button"
                              onClick={() => handleAttemptedFeedback(item.id, 'yes')}
                              className="zomato-option-row"
                            >
                              <span>Yes, this solved my problem</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttemptedFeedback(item.id, 'no')}
                              className="zomato-option-row"
                            >
                              <span>No, I need more help</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case 'workshops_list':
                return (
                  <div key={item.id} className="chat-row-bot">
                    <div className="zomato-chat-card">
                      <div className="zomato-card-header">
                        <div className="zomato-card-prompt">
                          Which workshop do you need help with?
                        </div>
                        <div className="zomato-card-subtitle">
                          Found {item.workshops.length} registration{item.workshops.length > 1 ? 's' : ''} linked with this {item.isEmail ? 'email ID' : 'mobile number'}
                        </div>
                        <span className="zomato-card-time">{getCurrentTime()}</span>
                      </div>

                      {!item.answered && (
                        <div className="zomato-options-list">
                          {item.workshops.map((ws) => (
                            <button
                              key={ws.orderId}
                              type="button"
                              onClick={() => handleSelectWorkshop(item.id, ws)}
                              className="zomato-option-row"
                            >
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{ws.brandName}</span>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#16a34a',
                                      background: '#f0fdf4',
                                      border: '1px solid #bbf7d0',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ₹{ws.amount}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 3 }}>
                                  Registered on: {ws.registrationDateFormatted}
                                </div>
                                {ws.hasWorkshopDate && ws.workshopTimeFormatted && (
                                  <div
                                    style={{
                                      fontSize: '11.5px',
                                      color: '#2563eb',
                                      marginTop: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Calendar size={12} />
                                    <span>Workshop: {ws.workshopTimeFormatted}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {ws.statusBadge === 'Upcoming' && <span className="badge-upcoming">Upcoming</span>}
                                {ws.statusBadge === 'Live now' && (
                                  <span className="badge-live">
                                    <span className="live-badge-dot" />
                                    Live
                                  </span>
                                )}
                                {ws.statusBadge === 'Completed' && (
                                  <span className="badge-completed">
                                    <Check size={11} />
                                    Completed
                                  </span>
                                )}
                                <ChevronRight size={15} style={{ color: '#94a3b8' }} />
                              </div>
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              setChatFeed((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, answered: true } : it))
                              );
                              triggerEscalation('I don’t see my workshop in the list');
                            }}
                            className="zomato-option-row"
                            style={{ color: '#64748b' }}
                          >
                            <span>My workshop is not listed here</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'live_now_highlight':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">Found your workshop!</div>
                      </div>
                    </div>

                    <div className="workshop-cards-list">
                      <div className="workshop-card-item" style={{ borderColor: '#fca5a5' }}>
                        <div className="workshop-card-left">
                          <div className="workshop-card-top-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className="workshop-card-brand">{item.workshop.brandName}</span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#16a34a',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                ₹{item.workshop.amount}
                              </span>
                            </div>
                            <span className="badge-live">
                              <span className="live-badge-dot" />
                              Live now
                            </span>
                          </div>
                          {item.workshop.hasWorkshopDate && item.workshop.workshopTimeFormatted && (
                            <div className="workshop-card-date-row" style={{ color: '#dc2626' }}>
                              <Calendar size={13} />
                              <span>Workshop: {item.workshop.workshopTimeFormatted}</span>
                            </div>
                          )}
                          <div className="workshop-card-date-row" style={{ color: '#64748b', fontSize: '11.5px', marginTop: 2 }}>
                            <span>Registered: {item.workshop.registrationDateFormatted}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">
                          Join quickly! The Zoom meeting link is pinned inside the WhatsApp community.
                        </div>
                      </div>
                    </div>

                    {item.workshop.whatsappCommunityLink && (
                      <div className="whatsapp-cta-block">
                        <a
                          href={item.workshop.whatsappCommunityLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-cta"
                        >
                          <MessageSquare size={18} />
                          <span>Open WhatsApp community</span>
                        </a>
                        <span className="whatsapp-cta-subtext">Opens in WhatsApp</span>
                      </div>
                    )}

                    {!item.answered && (
                      <div className="chips-container" style={{ marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleIssueSelect(item.id, 'ZOOM_LINK', 'I need the Zoom link')}
                          className="chip-btn"
                        >
                          <Video size={16} className="chip-icon" />
                          <span>I need the Zoom link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIssueSelect(item.id, 'WA_COMMUNITY', 'I need the WhatsApp community link')}
                          className="chip-btn"
                        >
                          <MessageSquare size={16} className="chip-icon" />
                          <span>I need the WhatsApp community link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIssueSelect(item.id, 'SOMETHING_ELSE', 'Something else')}
                          className="chip-btn"
                        >
                          <MoreHorizontal size={16} className="chip-icon" />
                          <span>Something else</span>
                        </button>
                      </div>
                    )}
                  </div>
                );

              case 'issue_select':
                return (
                  <div key={item.id} className="chat-row-bot">
                    <div className="zomato-chat-card">
                      <div className="zomato-card-header">
                        <div className="zomato-card-prompt">
                          How can we help you with your workshop?
                        </div>
                        <div className="zomato-card-subtitle">
                          {item.workshop.brandName} •{' '}
                          {item.workshop.hasWorkshopDate && item.workshop.relativeTimeText
                            ? item.workshop.relativeTimeText
                            : `Registered on ${item.workshop.registrationDateFormatted} (Paid ₹${item.workshop.amount})`}
                        </div>
                        <span className="zomato-card-time">{getCurrentTime()}</span>
                      </div>

                      {!item.answered && (
                        <div className="zomato-options-list">
                          {item.workshop.statusCategory === 'COMPLETED' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'MISSED_WORKSHOP', 'I missed / couldn’t attend the workshop')}
                                className="zomato-option-row"
                              >
                                <span>I missed / couldn’t attend the workshop</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'WANT_REFUND', 'I want a refund')}
                                className="zomato-option-row"
                              >
                                <span>I want a refund</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleIssueSelect(item.id, 'COURSE_ACCESS', 'I bought a course in the workshop but didn’t get access')
                                }
                                className="zomato-option-row"
                              >
                                <span>I bought a course in the workshop but didn’t get access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'SOMETHING_ELSE', 'I have another question')}
                                className="zomato-option-row"
                              >
                                <span>I have another question</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'ZOOM_LINK', 'Where can I get the Zoom link?')}
                                className="zomato-option-row"
                              >
                                <span>Where can I get the Zoom link?</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleIssueSelect(item.id, 'WA_COMMUNITY', 'I need the WhatsApp community link')
                                }
                                className="zomato-option-row"
                              >
                                <span>I need the WhatsApp community link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'CHANGE_TIMING', 'Can I change my workshop timing or batch?')}
                                className="zomato-option-row"
                              >
                                <span>Can I change my workshop timing or batch?</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIssueSelect(item.id, 'SOMETHING_ELSE', 'I have another question')}
                                className="zomato-option-row"
                              >
                                <span>I have another question</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'resolution_cta':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        {item.messages.map((msg, i) => (
                          <div key={i} className="chat-bubble-bot">
                            {msg}
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.ctaLink && (
                      <div className="whatsapp-cta-block">
                        <a
                          href={item.ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-cta"
                        >
                          <MessageSquare size={18} />
                          <span>{item.ctaText}</span>
                        </a>
                        <span className="whatsapp-cta-subtext">Opens in WhatsApp</span>
                      </div>
                    )}

                    {!item.answered && (
                      <div className="chat-row-bot" style={{ marginTop: 4 }}>
                        <div className="zomato-chat-card">
                          <div className="zomato-card-header">
                            <div className="zomato-card-prompt">Did this solve your problem?</div>
                            <span className="zomato-card-time">{getCurrentTime()}</span>
                          </div>
                          <div className="zomato-options-list">
                            <button
                              type="button"
                              onClick={() => handleResolutionFeedback(item.id, 'yes')}
                              className="zomato-option-row"
                            >
                              <span>Yes, this solved my problem</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolutionFeedback(item.id, 'no')}
                              className="zomato-option-row"
                            >
                              <span>No, I need more help</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case 'resolution_no_cta':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        {item.messages.map((msg, i) => (
                          <div key={i} className="chat-bubble-bot">
                            {msg}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="chips-container" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={handleContactCreator}
                        className="chip-btn"
                      >
                        <User size={16} className="chip-icon" />
                        <span>Contact the creator</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="chip-btn"
                      >
                        <RotateCcw size={16} className="chip-icon" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                );

              case 'creator_contact':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">
                          Course access is managed directly by {item.workshop.creatorName}. You can reach out directly via WhatsApp or Email below:
                        </div>
                      </div>
                    </div>

                    <div className="creator-contact-card">
                      <div className="creator-contact-header">
                        <div className="creator-avatar-circle">
                          {getInitials(item.workshop.creatorName)}
                        </div>
                        <div>
                          <div className="creator-info-title">{item.workshop.creatorName}</div>
                          <div className="creator-info-sub">{item.workshop.brandName}</div>
                        </div>
                      </div>

                      <div className="creator-actions-row">
                        {item.workshop.creatorSupportPhone ? (
                          <a
                            href={`https://wa.me/91${item.workshop.creatorSupportPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                              `Hi ${item.workshop.creatorName}, I purchased your course during the workshop on ${item.workshop.domain}.\nMy registered mobile: ${currentQuery || item.workshop.customerPhone}\nOrder ID: ${item.workshop.orderId}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-creator-wa"
                          >
                            <MessageSquare size={15} />
                            <span>Message on WhatsApp</span>
                          </a>
                        ) : (
                          <div className="btn-creator-wa" style={{ opacity: 0.6 }}>
                            <span>WhatsApp N/A</span>
                          </div>
                        )}

                        {item.workshop.creatorSupportEmail ? (
                          <a
                            href={`mailto:${item.workshop.creatorSupportEmail}?subject=${encodeURIComponent(
                              `Course Access Request: ${item.workshop.brandName}`
                            )}&body=${encodeURIComponent(
                              `Hi ${item.workshop.creatorName},\n\nI purchased your course during the workshop. Please grant me access.\nMy registered mobile: ${currentQuery || item.workshop.customerPhone}\nOrder ID: ${item.workshop.orderId}`
                            )}`}
                            className="btn-creator-mail"
                          >
                            <Mail size={15} />
                            <span>Email Creator</span>
                          </a>
                        ) : (
                          <div className="btn-creator-mail" style={{ opacity: 0.6 }}>
                            <span>Email N/A</span>
                          </div>
                        )}
                      </div>

                      <div className="creator-note-subtext">
                        Tip: Mention your registered mobile number and payment details so {item.workshop.creatorName} can grant you access faster.
                      </div>
                    </div>

                    <div className="chips-container" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const timeNow = getCurrentTime();
                          setChatFeed((prev) => [
                            ...prev,
                            {
                              id: `user-${Date.now()}`,
                              kind: 'user_message',
                              text: 'Creator isn’t responding',
                              time: timeNow,
                            },
                          ]);
                          triggerEscalation('Creator is not responding to course access requests');
                        }}
                        className="chip-btn"
                      >
                        <User size={16} className="chip-icon" />
                        <span>Creator isn’t responding</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const timeNow = getCurrentTime();
                          setChatFeed((prev) => [
                            ...prev,
                            {
                              id: `user-${Date.now()}`,
                              kind: 'user_message',
                              text: 'That’s all, thanks',
                              time: timeNow,
                            },
                            {
                              id: `success-${Date.now()}`,
                              kind: 'success_closing',
                              customerName: item.workshop.customerName,
                            },
                          ]);
                          setStep('SUCCESS_CLOSING');
                        }}
                        className="chip-btn"
                      >
                        <Check size={16} className="chip-icon" />
                        <span>That’s all, thanks</span>
                      </button>
                    </div>
                  </div>
                );

              case 'not_found_first':
                return (
                  <div key={item.id} className="chat-row-bot">
                    <div className="chat-bubble-stack">
                      <div className="chat-bubble-bot">
                        We couldn’t find any workshop registration linked with <strong>{item.query}</strong>.
                      </div>
                      <div className="chat-bubble-bot">
                        Please try again with a different phone number or email ID you might have used during payment.
                      </div>
                    </div>
                  </div>
                );

              case 'escalation':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">
                          Sorry this didn’t sort it out! Someone from our support team will help you personally.
                        </div>
                        <div className="chat-bubble-bot">
                          Message us on WhatsApp and we’ll reply within {supportSlaText}. Your booking details are already pre-filled in the message.
                        </div>
                      </div>
                    </div>

                    <div className="whatsapp-cta-block">
                      <a
                        href={getEscalationWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-cta"
                      >
                        <MessageSquare size={18} />
                        <span>Message us on WhatsApp</span>
                      </a>
                      <span className="whatsapp-cta-subtext">Creator Labs Workshops Support</span>
                    </div>

                    <div className="chips-container" style={{ marginTop: 6 }}>
                      {workshops.length > 1 && (
                        <button
                          type="button"
                          onClick={handleCheckOtherWorkshops}
                          className="chip-btn"
                        >
                          <Plus size={16} className="chip-icon" />
                          <span>Check my other workshops</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="chip-btn"
                      >
                        <RotateCcw size={16} className="chip-icon" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                );

              case 'success_closing':
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="chat-row-bot">
                      <div className="chat-bubble-stack">
                        <div className="chat-bubble-bot">
                          Glad that helped{item.customerName ? `, ${item.customerName.trim().split(' ')[0]}` : ''}! Have a great learning experience at your workshop!
                        </div>
                        <div className="chat-bubble-bot">
                          If anything else comes up, I’m right here.
                        </div>
                      </div>
                    </div>

                    <div className="chips-container" style={{ marginTop: 6 }}>
                      {workshops.length > 1 && (
                        <button
                          type="button"
                          onClick={handleCheckOtherWorkshops}
                          className="chip-btn"
                        >
                          <Plus size={16} className="chip-icon" />
                          <span>Check my other workshops</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="chip-btn"
                      >
                        <RotateCcw size={16} className="chip-icon" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
        </main>

        {/* Native Messaging Bottom Input Bar */}
        {(step === 'WELCOME' || step === 'NOT_FOUND_FIRST') && (
          <footer className="chat-bottom-bar">
            {inputError && (
              <div className="bottom-error-banner">
                <AlertCircle size={14} />
                <span>{inputError}</span>
              </div>
            )}

            {step === 'NOT_FOUND_FIRST' && !inputError && (
              <div className="bottom-hint-row">
                <AlertCircle size={13} />
                <span>Try again with a different phone number or email ID</span>
              </div>
            )}

            <div className={`bottom-input-container ${inputError ? 'has-error' : ''}`}>
              <User size={16} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const noSpaces = e.target.value.replace(/\s+/g, '');
                  setInputValue(noSpaces);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    return;
                  }
                  if (e.key === 'Enter') {
                    executeLookup(inputValue, step === 'NOT_FOUND_FIRST');
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasteText = e.clipboardData.getData('text').replace(/\s+/g, '');
                  setInputValue(pasteText);
                  if (inputError) setInputError(null);
                }}
                placeholder={
                  step === 'NOT_FOUND_FIRST'
                    ? 'Different phone number or email ID'
                    : '10-digit mobile or email ID'
                }
                className="bottom-text-input"
                autoFocus
              />

              <button
                type="button"
                onClick={() => executeLookup(inputValue, step === 'NOT_FOUND_FIRST')}
                disabled={!inputValue.trim()}
                className={`btn-bottom-send ${inputValue.trim() ? 'active' : ''}`}
                aria-label="Send"
              >
                <ArrowUp size={18} />
              </button>
            </div>

            {step === 'WELCOME' ? (
              <div className="bottom-footnote-row">
                <Lock size={12} />
                <span>Only used to find your booking. We never ask for OTP.</span>
              </div>
            ) : (
              <div className="bottom-escalate-text">
                Still can’t find it?{' '}
                <a
                  href={`https://wa.me/${centralWhatsApp}?text=${encodeURIComponent(
                    `Hi, I need help. I couldn't find my registration. My ${isEmailLookup ? 'email' : 'phone'}: ${currentQuery}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Message us on WhatsApp
                </a>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
