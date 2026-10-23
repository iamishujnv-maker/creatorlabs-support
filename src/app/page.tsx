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
  | 'NOT_FOUND_SECOND'
  | 'FEEDBACK'
  | 'ESCALATION'
  | 'SUCCESS_CLOSING';

export default function SupportAssistantPage() {
  const [step, setStep] = useState<Step>('WELCOME');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // History & Session Data
  const [firstAttemptQuery, setFirstAttemptQuery] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isEmailLookup, setIsEmailLookup] = useState<boolean>(false);

  // Results
  const [workshops, setWorkshops] = useState<PaidWorkshopItem[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<PaidWorkshopItem | null>(null);
  const [attemptedOrders, setAttemptedOrders] = useState<AttemptedWorkshopItem[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<string>('');

  // Resolution texts
  const [resolutionMessages, setResolutionMessages] = useState<string[]>([]);
  const [resolutionCtaLink, setResolutionCtaLink] = useState<string | null>(null);
  const [resolutionCtaText, setResolutionCtaText] = useState<string>('Join WhatsApp community');

  // Config
  const [centralWhatsApp, setCentralWhatsApp] = useState<string>('918949451726');
  const [supportSlaText, setSupportSlaText] = useState<string>('24–48 hours');

  // Conversation history for rendering
  const [userMessages, setUserMessages] = useState<{ id: string; text: string; subtext?: string }[]>([]);

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
  }, [step, userMessages]);

  // Reset to initial state
  const handleReset = () => {
    setStep('WELCOME');
    setInputValue('');
    setInputError(null);
    setFirstAttemptQuery(null);
    setCurrentQuery('');
    setWorkshops([]);
    setSelectedWorkshop(null);
    setAttemptedOrders([]);
    setSelectedIssue('');
    setUserMessages([]);
  };

  // Validate Phone / Email
  const validateInput = (val: string): { valid: boolean; isEmail: boolean; error?: string } => {
    const trimmed = val.trim();
    if (!trimmed) {
      return { valid: false, isEmail: false, error: 'Please enter your phone number or email.' };
    }

    if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return { valid: false, isEmail: true, error: 'Please enter a valid email address.' };
      }
      return { valid: true, isEmail: true };
    }

    // Phone validation
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10) {
      return {
        valid: false,
        isEmail: false,
        error: 'This number looks short. Enter all 10 digits, like 98765 43210.',
      };
    }

    return { valid: true, isEmail: false };
  };

  // Perform Lookup
  const executeLookup = async (queryToSearch: string, isSecondTry = false) => {
    setInputError(null);
    const validation = validateInput(queryToSearch);
    if (!validation.valid) {
      setInputError(validation.error || 'Invalid input');
      return;
    }

    const cleanDisplay = validation.isEmail
      ? queryToSearch.trim().toLowerCase()
      : queryToSearch.replace(/\D/g, '').slice(-10);

    // Add user bubble
    setUserMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: cleanDisplay },
    ]);

    setCurrentQuery(cleanDisplay);
    setIsEmailLookup(validation.isEmail);
    if (!isSecondTry) {
      setFirstAttemptQuery(cleanDisplay);
    }

    setStep('LOOKING_UP');

    try {
      // Natural 400ms micro-pause for typing indicator
      const [res] = await Promise.all([
        fetch(`/api/lookup?query=${encodeURIComponent(queryToSearch.trim())}`),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ]);

      const data = await res.json();

      if (!data.success || !data.result) {
        if (isSecondTry) {
          triggerEscalation('Unable to locate registration on second attempt');
        } else {
          setStep('NOT_FOUND_FIRST');
          setInputValue('');
        }
        return;
      }

      const lookup: SupportLookupResult = data.result;

      if (lookup.config) {
        if (lookup.config.centralSupportWhatsApp) setCentralWhatsApp(lookup.config.centralSupportWhatsApp);
        if (lookup.config.supportSlaText) setSupportSlaText(lookup.config.supportSlaText);
      }

      // Route by case priority
      if (lookup.caseType === 'CASE_A') {
        setWorkshops(lookup.workshops);

        // Check if there is an active Live Now workshop
        const liveNowOrder = lookup.workshops.find((w) => w.statusCategory === 'LIVE_NOW');
        if (liveNowOrder && lookup.workshops.length === 1) {
          setSelectedWorkshop(liveNowOrder);
          setStep('LIVE_NOW_HIGHLIGHT');
        } else {
          setStep('WORKSHOPS_LIST');
        }
      } else if (lookup.caseType === 'CASE_B') {
        setAttemptedOrders(lookup.attempts);
        setStep('ATTEMPTED_LIST');
      } else {
        // CASE C
        if (isSecondTry) {
          triggerEscalation('Registration not found after phone and email search');
        } else {
          setStep('NOT_FOUND_FIRST');
          setInputValue('');
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setInputError('Network error. Please check your connection and try again.');
      setStep('WELCOME');
    }
  };

  // Workshop Selected
  const handleSelectWorkshop = (ws: PaidWorkshopItem) => {
    setSelectedWorkshop(ws);

    // Push selection as user message
    setUserMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: ws.brandName,
        subtext: ws.workshopTimeFormatted,
      },
    ]);

    if (ws.statusCategory === 'LIVE_NOW') {
      setStep('LIVE_NOW_HIGHLIGHT');
    } else {
      setStep('ISSUE_SELECT');
    }
  };

  // Issue Handlers
  const handleIssueSelect = (issueKey: string, issueLabel: string) => {
    setSelectedIssue(issueLabel);
    if (!selectedWorkshop) return;

    setUserMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: issueLabel },
    ]);

    const communityLink = selectedWorkshop.whatsappCommunityLink || 'https://chat.whatsapp.com/';

    switch (issueKey) {
      case 'ZOOM_LINK':
        if (selectedWorkshop.statusCategory === 'LIVE_NOW') {
          setResolutionMessages([
            'The workshop has started! The Zoom link is in the WhatsApp community — open it now to join.',
          ]);
          setResolutionCtaText('Open WhatsApp community');
          setResolutionCtaLink(communityLink);
          setStep('RESOLUTION_CTA');
        } else {
          setResolutionMessages([
            'The Zoom link is shared only in the WhatsApp community, a day before the workshop and on the workshop day. If you’ve already joined, please wait — it’ll arrive there.',
          ]);
          setResolutionCtaText('Join WhatsApp community');
          setResolutionCtaLink(communityLink);
          setStep('RESOLUTION_CTA');
        }
        break;

      case 'WA_COMMUNITY':
        setResolutionMessages([
          `Here’s the WhatsApp community for ${selectedWorkshop.brandName}.`,
          'The Zoom link is posted there before the workshop. Join now so you don’t miss it.',
        ]);
        setResolutionCtaText(
          selectedWorkshop.statusCategory === 'LIVE_NOW' ? 'Open WhatsApp community' : 'Join WhatsApp community'
        );
        setResolutionCtaLink(communityLink);
        setStep('RESOLUTION_CTA');
        break;

      case 'CHANGE_TIMING':
        setResolutionMessages([
          'Sorry, workshop timings can’t be changed. Join the community so you don’t miss this or upcoming sessions.',
        ]);
        setResolutionCtaText('Join WhatsApp community');
        setResolutionCtaLink(communityLink);
        setStep('RESOLUTION_CTA');
        break;

      case 'MISSED_WORKSHOP':
        setResolutionMessages([
          'No worries! Join the community below to get details of the next workshop.',
        ]);
        setResolutionCtaText('Join WhatsApp community');
        setResolutionCtaLink(communityLink);
        setStep('RESOLUTION_CTA');
        break;

      case 'WANT_REFUND':
        setResolutionMessages([
          'I understand. It’s disappointing when plans change.',
          'Workshop fees are non-refundable, so I can’t process a refund for this one.',
          `${selectedWorkshop.creatorName} sometimes shares a recording or a seat in the next batch. You can ask directly.`,
        ]);
        setStep('RESOLUTION_NO_CTA');
        break;

      case 'COURSE_ACCESS':
        setStep('CREATOR_CONTACT');
        break;

      case 'SOMETHING_ELSE':
        triggerEscalation(issueLabel);
        break;

      default:
        triggerEscalation(issueLabel);
        break;
    }
  };

  // Trigger Escalation (Step 4 "No" path / H12)
  const triggerEscalation = (reason?: string) => {
    setSelectedIssue(reason || selectedIssue || 'General Query');
    setStep('ESCALATION');
  };

  // Build WhatsApp Support URL
  const getEscalationWhatsAppUrl = () => {
    let msg = '';
    if (selectedWorkshop) {
      msg = `Hi, I need help. Order: ${selectedWorkshop.orderId}, Workshop: ${selectedWorkshop.brandName}, Issue: ${selectedIssue || 'Support inquiry'}`;
    } else {
      msg = `Hi, I need help. I couldn't find my registration. My ${isEmailLookup ? 'email' : 'phone'}: ${currentQuery}`;
    }

    return `https://wa.me/${centralWhatsApp}?text=${encodeURIComponent(msg)}`;
  };

  // Creator Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CL';
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
            <div className="chat-avatar-cl">CL</div>
            <div className="chat-header-info">
              <span className="chat-header-title">Creator Lab Help</span>
              <span className="chat-header-subtitle">
                <span className="status-dot-green" />
                <span>Online • replies in seconds</span>
              </span>
            </div>
          </div>

          {step !== 'WELCOME' && (
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

        {/* Chat Scroll Area */}
        <main className="chat-scroll-area" ref={scrollRef}>
          {/* Centered Date Pill */}
          <div className="chat-date-separator">
            <span className="chat-date-text">Today</span>
          </div>

          {/* Initial Bot Welcome Bubbles */}
          <div className="chat-row-bot">
            <div className="chat-avatar-small">CL</div>
            <div className="chat-bubble-stack">
              <div className="chat-bubble-bot">
                Hi! I&apos;m the Creator Lab help assistant.
              </div>
              <div className="chat-bubble-bot">
                Enter the phone number or email you used to pay. I&apos;ll find your workshop.
              </div>
            </div>
          </div>

          {/* Render User & Interactive Stages */}
          {userMessages.map((m) => (
            <div key={m.id} className="chat-row-user">
              <div className="chat-bubble-user">
                <div>{m.text}</div>
                {m.subtext && (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: 2 }}>
                    {m.subtext}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* STATE: WELCOME (H01, H01b) */}
          {step === 'WELCOME' && (
            <div className="chat-input-card">
              <div className={`input-field-wrapper ${inputError ? 'has-error' : ''}`}>
                <User size={16} style={{ color: inputError ? '#dc2626' : '#94a3b8' }} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeLookup(inputValue);
                  }}
                  placeholder="Phone number or email"
                  className="chat-text-input"
                  autoFocus
                />
                {inputError && <AlertCircle size={16} style={{ color: '#dc2626' }} />}
              </div>

              {inputError && <div className="input-error-text">{inputError}</div>}

              <button
                type="button"
                onClick={() => executeLookup(inputValue)}
                className="btn-submit-continue"
              >
                <span>Continue</span>
                <span>→</span>
              </button>

              <div className="input-security-note">
                <Lock size={12} />
                <span>Only used to find your booking. We never ask for OTP.</span>
              </div>
            </div>
          )}

          {/* STATE: LOOKING_UP (H02) */}
          {step === 'LOOKING_UP' && (
            <div className="chat-row-bot">
              <div className="chat-avatar-small">CL</div>
              <div>
                <div className="typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <div className="typing-subtext">Looking up your workshops...</div>
              </div>
            </div>
          )}

          {/* STATE: CASE A - WORKSHOPS LIST (H03) */}
          {step === 'WORKSHOPS_LIST' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    I found {workshops.length} workshop{workshops.length > 1 ? 's' : ''} booked with this {isEmailLookup ? 'email' : 'number'}.
                  </div>
                  <div className="chat-bubble-bot">
                    Which one do you need help with?
                  </div>
                </div>
              </div>

              <div className="workshop-cards-list">
                {workshops.map((ws) => (
                  <div
                    key={ws.orderId}
                    onClick={() => handleSelectWorkshop(ws)}
                    className="workshop-card-item"
                  >
                    <div className="workshop-card-left">
                      <div className="workshop-card-top-row">
                        <span className="workshop-card-brand">{ws.brandName}</span>
                        {ws.statusBadge === 'Upcoming' && (
                          <span className="badge-upcoming">Upcoming</span>
                        )}
                        {ws.statusBadge === 'Live now' && (
                          <span className="badge-live">
                            <span className="live-badge-dot" />
                            Live now
                          </span>
                        )}
                        {ws.statusBadge === 'Completed' && (
                          <span className="badge-completed">
                            <Check size={11} />
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="workshop-card-date-row">
                        <Calendar size={13} />
                        <span>{ws.workshopTimeFormatted}</span>
                      </div>
                    </div>

                    <ChevronRight size={18} className="workshop-card-chevron" />
                  </div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
                    Tap a workshop above, or
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerEscalation('I don’t see my workshop in the list')}
                    className="chip-btn"
                  >
                    <HelpCircle size={16} className="chip-icon" />
                    <span>I don’t see my workshop</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STATE: LIVE NOW SPECIAL HIGHLIGHT (H14) */}
          {step === 'LIVE_NOW_HIGHLIGHT' && selectedWorkshop && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">Found your workshop.</div>
                </div>
              </div>

              <div className="workshop-cards-list">
                <div className="workshop-card-item" style={{ borderColor: '#fca5a5' }}>
                  <div className="workshop-card-left">
                    <div className="workshop-card-top-row">
                      <span className="workshop-card-brand">{selectedWorkshop.brandName}</span>
                      <span className="badge-live">
                        <span className="live-badge-dot" />
                        Live now
                      </span>
                    </div>
                    <div className="workshop-card-date-row" style={{ color: '#dc2626' }}>
                      <Calendar size={13} />
                      <span>{selectedWorkshop.workshopTimeFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    Join quickly. The Zoom link is pinned in the WhatsApp community.
                  </div>
                </div>
              </div>

              {selectedWorkshop.whatsappCommunityLink && (
                <div className="whatsapp-cta-block">
                  <a
                    href={selectedWorkshop.whatsappCommunityLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setStep('FEEDBACK')}
                    className="btn-whatsapp-cta"
                  >
                    <MessageSquare size={18} />
                    <span>Open WhatsApp community</span>
                  </a>
                  <span className="whatsapp-cta-subtext">Opens in WhatsApp</span>
                </div>
              )}

              <div className="chips-container" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => handleIssueSelect('ZOOM_LINK', 'I need the Zoom link')}
                  className="chip-btn"
                >
                  <Video size={16} className="chip-icon" />
                  <span>I need the Zoom link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueSelect('WA_COMMUNITY', 'I need the WhatsApp community link')}
                  className="chip-btn"
                >
                  <MessageSquare size={16} className="chip-icon" />
                  <span>I need the WhatsApp community link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueSelect('SOMETHING_ELSE', 'Something else')}
                  className="chip-btn"
                >
                  <MoreHorizontal size={16} className="chip-icon" />
                  <span>Something else</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: ISSUE SELECTION (H04 Upcoming / H05 Completed) */}
          {step === 'ISSUE_SELECT' && selectedWorkshop && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    {selectedWorkshop.relativeTimeText}
                  </div>
                  <div className="chat-bubble-bot">
                    What do you need help with?
                  </div>
                </div>
              </div>

              {selectedWorkshop.statusCategory === 'COMPLETED' ? (
                /* Completed workshop chips (H05) */
                <div className="chips-container">
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('MISSED_WORKSHOP', 'I missed the workshop')}
                    className="chip-btn"
                  >
                    <Calendar size={16} className="chip-icon" />
                    <span>I missed the workshop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('WANT_REFUND', 'I want a refund')}
                    className="chip-btn"
                  >
                    <IndianRupee size={16} className="chip-icon" />
                    <span>I want a refund</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('COURSE_ACCESS', 'I bought the course but didn’t get access')}
                    className="chip-btn"
                  >
                    <Lock size={16} className="chip-icon" />
                    <span>I bought the course but didn’t get access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('SOMETHING_ELSE', 'Something else')}
                    className="chip-btn"
                  >
                    <MoreHorizontal size={16} className="chip-icon" />
                    <span>Something else</span>
                  </button>
                </div>
              ) : (
                /* Upcoming workshop chips (H04) */
                <div className="chips-container">
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('ZOOM_LINK', 'I need the Zoom link')}
                    className="chip-btn"
                  >
                    <Video size={16} className="chip-icon" />
                    <span>I need the Zoom link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('WA_COMMUNITY', 'I need the WhatsApp community link')}
                    className="chip-btn"
                  >
                    <MessageSquare size={16} className="chip-icon" />
                    <span>I need the WhatsApp community link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('CHANGE_TIMING', 'Can I change my timing?')}
                    className="chip-btn"
                  >
                    <Clock size={16} className="chip-icon" />
                    <span>Can I change my timing?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIssueSelect('SOMETHING_ELSE', 'Something else')}
                    className="chip-btn"
                  >
                    <MoreHorizontal size={16} className="chip-icon" />
                    <span>Something else</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* STATE: RESOLUTION WITH CTA (H06) */}
          {step === 'RESOLUTION_CTA' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  {resolutionMessages.map((msg, i) => (
                    <div key={i} className="chat-bubble-bot">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>

              {resolutionCtaLink && (
                <div className="whatsapp-cta-block">
                  <a
                    href={resolutionCtaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setStep('FEEDBACK')}
                    className="btn-whatsapp-cta"
                  >
                    <MessageSquare size={18} />
                    <span>{resolutionCtaText}</span>
                  </a>
                  <span className="whatsapp-cta-subtext">Opens in WhatsApp</span>
                </div>
              )}

              {/* Also show feedback question below */}
              <div className="chat-row-bot" style={{ marginTop: 12 }}>
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-bot">Did this solve your problem?</div>
              </div>

              <div className="feedback-options-row">
                <button
                  type="button"
                  onClick={() => setStep('SUCCESS_CLOSING')}
                  className="btn-feedback"
                >
                  <ThumbsUp size={16} style={{ color: '#16a34a' }} />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerEscalation('Needs further assistance')}
                  className="btn-feedback"
                >
                  <ThumbsDown size={16} style={{ color: '#dc2626' }} />
                  <span>No</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: RESOLUTION NO CTA - REFUND (H07) */}
          {step === 'RESOLUTION_NO_CTA' && selectedWorkshop && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  {resolutionMessages.map((msg, i) => (
                    <div key={i} className="chat-bubble-bot">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>

              <div className="chips-container" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setStep('CREATOR_CONTACT')}
                  className="chip-btn"
                >
                  <User size={16} className="chip-icon" />
                  <span>Contact the creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (workshops.length > 1) setStep('WORKSHOPS_LIST');
                    else setStep('WELCOME');
                  }}
                  className="chip-btn"
                >
                  <Plus size={16} className="chip-icon" />
                  <span>I need help with something else</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: CREATOR CONTACT CARD (H08) */}
          {step === 'CREATOR_CONTACT' && selectedWorkshop && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    You can reach {selectedWorkshop.creatorName} directly. Most creators reply within a day.
                  </div>
                </div>
              </div>

              <div className="creator-contact-card">
                <div className="creator-contact-header">
                  <div className="creator-avatar-circle">
                    {getInitials(selectedWorkshop.creatorName)}
                  </div>
                  <div>
                    <div className="creator-info-title">{selectedWorkshop.creatorName}</div>
                    <div className="creator-info-sub">{selectedWorkshop.brandName}</div>
                  </div>
                </div>

                <div className="creator-actions-row">
                  {selectedWorkshop.creatorSupportPhone ? (
                    <a
                      href={`https://wa.me/91${selectedWorkshop.creatorSupportPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${selectedWorkshop.creatorName}, I registered for your workshop on ${selectedWorkshop.domain}. My phone: ${selectedWorkshop.customerPhone}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-creator-wa"
                    >
                      <MessageSquare size={15} />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <div className="btn-creator-wa" style={{ opacity: 0.6 }}>
                      <span>WhatsApp N/A</span>
                    </div>
                  )}

                  {selectedWorkshop.creatorSupportEmail ? (
                    <a
                      href={`mailto:${selectedWorkshop.creatorSupportEmail}?subject=${encodeURIComponent(`Workshop Query: ${selectedWorkshop.brandName}`)}&body=${encodeURIComponent(`Hi ${selectedWorkshop.creatorName},\n\nI registered for your workshop. My phone: ${selectedWorkshop.customerPhone}\nOrder ID: ${selectedWorkshop.orderId}`)}`}
                      className="btn-creator-mail"
                    >
                      <Mail size={15} />
                      <span>Email</span>
                    </a>
                  ) : (
                    <div className="btn-creator-mail" style={{ opacity: 0.6 }}>
                      <span>Email N/A</span>
                    </div>
                  )}
                </div>

                <div className="creator-note-subtext">
                  Mention your registered phone number so {selectedWorkshop.creatorName} can find you quickly.
                </div>
              </div>

              <div className="chips-container" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => triggerEscalation('Creator is not responding')}
                  className="chip-btn"
                >
                  <User size={16} className="chip-icon" />
                  <span>Creator isn’t responding</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('SUCCESS_CLOSING')}
                  className="chip-btn"
                >
                  <Check size={16} className="chip-icon" />
                  <span>That’s all, thanks</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: CASE B - PAYMENT NOT COMPLETED (H09) */}
          {step === 'ATTEMPTED_LIST' && (
            <>
              {attemptedOrders.map((att) => (
                <div key={att.orderId} className="attempted-card">
                  <div className="attempted-header">
                    <AlertCircle size={14} />
                    <span>Payment not completed</span>
                  </div>
                  <div className="attempted-body">
                    Your payment didn’t go through. You tried to register for{' '}
                    <strong>{att.brandName}</strong> on {att.domain} but the payment wasn’t completed.
                  </div>
                  <div className="attempted-meta">{att.triedDateFormatted}</div>
                  <a
                    href={att.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-register-again"
                  >
                    <span>Register again</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}

              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    If money was deducted, your bank usually returns it in 5–7 working days.
                  </div>
                </div>
              </div>

              <div className="chips-container" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => triggerEscalation('Money deducted but payment not confirmed')}
                  className="chip-btn"
                >
                  <CreditCard size={16} className="chip-icon" />
                  <span>Money was deducted from my account</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerEscalation('Other query regarding attempted payment')}
                  className="chip-btn"
                >
                  <MoreHorizontal size={16} className="chip-icon" />
                  <span>Something else</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: CASE C - NOT FOUND FIRST TRY (H10) */}
          {step === 'NOT_FOUND_FIRST' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    I couldn’t find a workshop booked with {currentQuery}.
                  </div>
                  <div className="chat-bubble-bot">
                    Sometimes the booking is saved under your {isEmailLookup ? 'phone number' : 'email'} instead. Can you try that?
                  </div>
                </div>
              </div>

              <div className="chat-input-card">
                <div className={`input-field-wrapper ${inputError ? 'has-error' : ''}`}>
                  {isEmailLookup ? (
                    <User size={16} style={{ color: '#94a3b8' }} />
                  ) : (
                    <Mail size={16} style={{ color: '#94a3b8' }} />
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeLookup(inputValue, true);
                    }}
                    placeholder={isEmailLookup ? 'Enter your 10-digit phone number' : 'Enter your email'}
                    className="chat-text-input"
                    autoFocus
                  />
                  {inputError && <AlertCircle size={16} style={{ color: '#dc2626' }} />}
                </div>

                {inputError && <div className="input-error-text">{inputError}</div>}

                <div className="input-hint-row">
                  <AlertCircle size={13} />
                  <span>
                    Try the {isEmailLookup ? 'phone number' : 'email'} you used while paying
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => executeLookup(inputValue, true)}
                  className="btn-submit-continue"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>

                <div className="not-found-escalate-link">
                  Still can’t find it?{' '}
                  <a
                    href={`https://wa.me/${centralWhatsApp}?text=${encodeURIComponent(`Hi, I need help. I couldn't find my registration. My ${isEmailLookup ? 'email' : 'phone'}: ${currentQuery}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Message us on WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}

          {/* STATE: FEEDBACK (H11) */}
          {step === 'FEEDBACK' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-bot">Did this solve your problem?</div>
              </div>

              <div className="feedback-options-row">
                <button
                  type="button"
                  onClick={() => setStep('SUCCESS_CLOSING')}
                  className="btn-feedback"
                >
                  <ThumbsUp size={16} style={{ color: '#16a34a' }} />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerEscalation('Feedback: No')}
                  className="btn-feedback"
                >
                  <ThumbsDown size={16} style={{ color: '#dc2626' }} />
                  <span>No</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: ESCALATION ("No" path / H12) */}
          {step === 'ESCALATION' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    Sorry this didn’t sort it out. Someone from our team will help you personally.
                  </div>
                  <div className="chat-bubble-bot">
                    Message us on WhatsApp and we’ll reply within {supportSlaText}. Your booking details are already in the message.
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
                <span className="whatsapp-cta-subtext">Creator Lab support</span>
              </div>

              <div className="chips-container" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (workshops.length > 1) setStep('WORKSHOPS_LIST');
                    else setStep('WELCOME');
                  }}
                  className="chip-btn"
                >
                  <Plus size={16} className="chip-icon" />
                  <span>I need help with something else</span>
                </button>
              </div>
            </>
          )}

          {/* STATE: SUCCESS / CLOSING ("Yes" path / H13) */}
          {step === 'SUCCESS_CLOSING' && (
            <>
              <div className="chat-row-bot">
                <div className="chat-avatar-small">CL</div>
                <div className="chat-bubble-stack">
                  <div className="chat-bubble-bot">
                    Glad that helped{selectedWorkshop?.customerName ? `, ${selectedWorkshop.customerName.trim().split(' ')[0]}` : ''}! Enjoy your workshop!
                  </div>
                  <div className="chat-bubble-bot">
                    If anything else comes up, I’m right here.
                  </div>
                </div>
              </div>

              <div className="chips-container" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (workshops.length > 1) setStep('WORKSHOPS_LIST');
                    else setStep('WELCOME');
                  }}
                  className="chip-btn"
                >
                  <Plus size={16} className="chip-icon" />
                  <span>I need help with something else</span>
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
