'use client';

import React, { useState, useEffect } from 'react';
import { Registration } from '@/types';
import {
  Calendar,
  Clock,
  MessageCircle,
  Video,
  Copy,
  Check,
  Mail,
  Phone,
  Send,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

interface Props {
  registration: Registration;
  onOpenTicketModal: (reg: Registration) => void;
}

export default function RegistrationCard({ registration, onOpenTicketModal }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; isPast: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    isPast: false,
  });

  const workshop = registration.workshop;
  const creator = workshop?.creator;

  // Calculate countdown and unlock state
  useEffect(() => {
    if (!workshop?.start_time) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const eventTime = new Date(workshop.start_time).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isPast: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ days, hours, minutes, isPast: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [workshop?.start_time]);

  if (!workshop) return null;

  // Zoom is unlocked if event is within available hours before start
  const eventDate = new Date(workshop.start_time);
  const hoursUntilEvent = (eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const isZoomUnlocked = hoursUntilEvent <= (workshop.zoom_available_hours_before || 24);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await fetch('/api/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registration.id,
          email: registration.user_email,
          phone: registration.user_phone,
          workshop_title: workshop.title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus(data.message || 'Details resent successfully!');
      } else {
        setResendStatus('Failed to resend details. Please raise a ticket below.');
      }
    } catch {
      setResendStatus('Network error while resending.');
    } finally {
      setResending(false);
      setTimeout(() => setResendStatus(null), 6000);
    }
  };

  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = eventDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <article className="workshop-card animate-fade-in">
      {/* Top Header */}
      <div className="workshop-card-header">
        <div className="creator-profile">
          <img
            src={creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={creator?.name || 'Creator'}
            className="creator-avatar"
          />
          <div className="creator-info">
            <div className="creator-meta">
              <span>{creator?.brand_name || 'Creator Labs Partner'}</span>
              <span className="badge-verified">
                <ShieldCheck size={12} /> Verified Workshop
              </span>
            </div>
            <h3>{workshop.title}</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <span className="status-badge status-confirmed">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            Payment Confirmed ({registration.currency} {registration.amount_paid})
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Ref: {registration.payment_id}
          </span>
        </div>
      </div>

      {/* Schedule Banner */}
      <div className="schedule-banner">
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="schedule-item">
            <div className="schedule-icon-wrap">
              <Calendar size={18} />
            </div>
            <div>
              <div className="schedule-title">Date</div>
              <div className="schedule-value">{formattedDate}</div>
            </div>
          </div>

          <div className="schedule-item">
            <div className="schedule-icon-wrap">
              <Clock size={18} />
            </div>
            <div>
              <div className="schedule-title">Time</div>
              <div className="schedule-value">{formattedTime} IST ({workshop.duration_minutes} Mins)</div>
            </div>
          </div>
        </div>

        <div className="countdown-box">
          <Clock size={16} />
          {timeLeft.isPast ? (
            <span>Workshop Concluded</span>
          ) : (
            <span>
              Starts in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          )}
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="workshop-body">
        <div className="action-grid">
          {/* Action 1: WhatsApp Community */}
          <div className="action-box action-box-wa">
            <div>
              <div className="action-box-header">
                <div className="action-box-title" style={{ color: '#4ade80' }}>
                  <MessageCircle size={22} />
                  <span>WhatsApp Community</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(37, 211, 102, 0.15)',
                    color: '#86efac',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  Immediate Access
                </span>
              </div>
              <p className="action-box-desc">
                Join the official community to receive prep assignments, workshop worksheets, and live updates directly from {creator?.name}.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
              <a
                href={workshop.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle size={18} />
                <span>Join Official WhatsApp Group</span>
                <ExternalLink size={16} />
              </a>

              <button
                type="button"
                onClick={() => copyToClipboard(workshop.whatsapp_link, 'whatsapp')}
                className="copy-link-btn"
              >
                {copiedField === 'whatsapp' ? (
                  <>
                    <Check size={14} style={{ color: '#22c55e' }} />
                    <span style={{ color: '#22c55e' }}>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Group Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action 2: Zoom Webinar Access */}
          <div className="action-box action-box-zoom">
            <div>
              <div className="action-box-header">
                <div className="action-box-title" style={{ color: '#60a5fa' }}>
                  <Video size={22} />
                  <span>Zoom Webinar Room</span>
                </div>
                {isZoomUnlocked ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(45, 140, 255, 0.15)',
                      color: '#93c5fd',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Unlock size={12} /> Link Active
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fcd34d',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Lock size={12} /> Unlocks 24h Prior
                  </span>
                )}
              </div>

              {isZoomUnlocked ? (
                <p className="action-box-desc">
                  The live session is ready. Use the 1-click join button below or use Meeting ID & Passcode.
                </p>
              ) : (
                <p className="action-box-desc">
                  To protect attendees from link sharing, the direct Zoom join room opens <strong>24 hours prior</strong> to the event. An automated SMS & WhatsApp notification will also be dispatched.
                </p>
              )}

              {/* Meeting credentials if unlocked */}
              {isZoomUnlocked && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0.75rem 0 0.5rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Meeting ID: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{workshop.zoom_meeting_id || '981 2498 2143'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Passcode: </span>
                    <strong style={{ color: '#60a5fa' }}>{workshop.zoom_passcode || 'LABS2026'}</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
              {isZoomUnlocked ? (
                <>
                  <a
                    href={workshop.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-zoom"
                  >
                    <Video size={18} />
                    <span>Join Zoom Webinar Now</span>
                    <ExternalLink size={16} />
                  </a>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(workshop.zoom_link, 'zoom')}
                    className="copy-link-btn"
                  >
                    {copiedField === 'zoom' ? (
                      <>
                        <Check size={14} style={{ color: '#22c55e' }} />
                        <span style={{ color: '#22c55e' }}>Zoom Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Zoom Link & Passcode</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="btn-zoom-locked">
                  <Lock size={16} />
                  <span>Zoom Access Unlocks {formattedDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Creator Direct Support & Working Hours */}
        <div className="creator-contacts-bar">
          <div className="contact-meta">
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
              Creator Team Contact:
            </span>
            <div className="contact-item">
              <Mail size={15} style={{ color: '#38bdf8' }} />
              <a href={`mailto:${creator?.email}`} className="contact-link">
                {creator?.email || 'support@creatorlabs.in'}
              </a>
            </div>
            {creator?.phone && (
              <div className="contact-item">
                <Phone size={15} style={{ color: '#4ade80' }} />
                <span>{creator.phone}</span>
              </div>
            )}
            {creator?.support_hours && (
              <div className="contact-item" style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                <span>• {creator.support_hours}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenTicketModal(registration)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <HelpCircle size={14} />
            <span>Raise Query to Creator</span>
          </button>
        </div>

        {/* Quick Resend Notification Strip */}
        <div className="resend-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>
              Didn’t receive the confirmation email or WhatsApp notification on{' '}
              <strong>{registration.user_phone}</strong>?
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {resendStatus && (
              <span style={{ fontSize: '0.825rem', color: '#4ade80', fontWeight: 600 }}>
                {resendStatus}
              </span>
            )}
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="btn-secondary"
            >
              <Send size={13} />
              <span>{resending ? 'Resending...' : 'Resend to My Phone & Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
