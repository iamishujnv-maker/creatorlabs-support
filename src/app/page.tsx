'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import RegistrationCard from '@/components/RegistrationCard';
import TicketModal from '@/components/TicketModal';
import LiveChatWidget from '@/components/LiveChatWidget';
import { Registration } from '@/types';
import confetti from 'canvas-confetti';
import {
  Search,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Chat
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q || q.trim().length < 3) {
      setErrorMsg('Please enter at least 3 digits of your phone number or your email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/lookup?query=${encodeURIComponent(q.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRegistrations(data.registrations);
        if (data.registrations.length > 0) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#6366f1', '#25d366', '#2d8cff', '#a855f7'],
            });
          } catch {
            // Ignore if confetti blocked
          }
        }
      } else {
        setErrorMsg(data.error || 'Failed to retrieve registration details.');
        setRegistrations([]);
      }
    } catch {
      setErrorMsg('Network error. Please try again or reach out via Live Support.');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChip = (val: string) => {
    setQuery(val);
    handleSearch(val);
  };

  const handleOpenTicketForReg = (reg: Registration) => {
    setSelectedReg(reg);
    setIsTicketOpen(true);
  };

  const faqs = [
    {
      q: 'I paid on the Creator landing page but didn’t get the WhatsApp community link?',
      a: 'After successful payment via Meta ads or the creator’s landing page, the WhatsApp community invite is generated automatically. Enter your phone number or email above to instantly access your verified WhatsApp group link and join the attendees group.',
    },
    {
      q: 'Where do I find my Zoom link and meeting passcode?',
      a: 'To maintain workshop security and prevent unauthorized link redistribution, the direct Zoom join room and passcode unlock 24 hours prior to the session start time. An automated SMS and WhatsApp alert is also broadcast to all registered participants.',
    },
    {
      q: 'How do I contact the creator’s team directly?',
      a: 'Every workshop card above contains the verified direct support email, WhatsApp number, and operating hours of the respective creator’s team.',
    },
    {
      q: 'What if my payment went through but no workshops appear?',
      a: 'Make sure you are entering the exact mobile number or email entered during the checkout form. If you used UPI via another number, click "Raise a Support Request" below and our ops team will match your bank reference ID within minutes.',
    },
  ];

  return (
    <>
      <div className="page-background" />
      <Navbar onOpenChat={() => setIsChatOpen(!isChatOpen)} />

      <main className="container" style={{ minHeight: '80vh' }}>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>Instant Self-Service Helpdesk for Creator Workshops</span>
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">Lost Your Workshop Access?</span>
            <br />
            <span className="gradient-accent">Get Instant Links & Support</span>
          </h1>

          <p className="hero-subtitle">
            Enter the mobile number or email you used on the creator’s checkout page. Retrieve your WhatsApp Community, Zoom access, and workshop schedule immediately.
          </p>

          {/* Search Card */}
          <div className="container-narrow">
            <div className="search-card">
              <form
                className="search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
              >
                <div className="input-group">
                  <div className="input-wrapper">
                    <Search size={20} className="input-icon" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter registered Phone (e.g. 9876543210) or Email..."
                      className="search-input"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    <span>{loading ? 'Searching...' : 'Find My Workshop'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>

              {/* Quick test badges */}
              <div className="quick-test-section">
                <span>Quick Test Demos:</span>
                <button
                  type="button"
                  onClick={() => handleQuickChip('9876543210')}
                  className="quick-chip"
                >
                  📱 9876543210 (Rahul Sharma - 2 Masterclasses)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('9811223344')}
                  className="quick-chip"
                >
                  ⚡ 9811223344 (Priya Patel - Zoom Live Today)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('arjun.v@example.com')}
                  className="quick-chip"
                >
                  ✉️ arjun.v@example.com (Arjun Verma)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Error message */}
        {errorMsg && (
          <div className="container-narrow" style={{ marginTop: '1.5rem' }}>
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem',
              }}
            >
              <ShieldAlert size={20} />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <section className="results-wrapper">
            {registrations.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                    Found {registrations.length} Confirmed {registrations.length === 1 ? 'Registration' : 'Registrations'}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Attendee: <strong>{registrations[0].user_name}</strong>
                  </span>
                </div>

                {registrations.map((reg) => (
                  <RegistrationCard
                    key={reg.id}
                    registration={reg}
                    onOpenTicketModal={handleOpenTicketForReg}
                  />
                ))}
              </>
            ) : (
              <div className="empty-state animate-fade-in">
                <div className="empty-icon">
                  <ShieldAlert size={28} />
                </div>
                <h3 className="empty-title">No Registration Found for &quot;{query}&quot;</h3>
                <p className="empty-desc">
                  We couldn&apos;t match this number or email to an active workshop ticket. Please verify that you typed the exact number used during your Meta ad payment checkout.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReg(null);
                      setIsTicketOpen(true);
                    }}
                    className="btn-primary"
                  >
                    <span>Raise a Payment Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="btn-secondary"
                  >
                    <MessageSquare size={16} />
                    <span>Talk to Live Chat Support</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* FAQ Section */}
        <section style={{ margin: '5rem 0 3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Frequently Answered Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Common solutions to common workshop access inquiries.
            </p>
          </div>

          <div className="container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'var(--transition)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.1rem 1.4rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {openFaq === idx && (
                  <div
                    style={{
                      padding: '0 1.4rem 1.25rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Escalation Help Footer */}
        <section className="helpdesk-footer">
          <div className="helpdesk-info">
            <h4>Still Have Unanswered Questions?</h4>
            <p>
              Creator Labs in-house customer operations team monitors and manages incoming tickets with a guaranteed under-15-minute response time on webinar days.
            </p>
          </div>

          <div className="helpdesk-actions">
            <button
              type="button"
              onClick={() => {
                setSelectedReg(null);
                setIsTicketOpen(true);
              }}
              className="btn-primary"
            >
              <HelpCircle size={17} />
              <span>Submit a Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="btn-secondary"
            >
              <MessageSquare size={17} />
              <span>Launch Live Chat</span>
            </button>
          </div>
        </section>
      </main>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        defaultRegistration={selectedReg}
        defaultQuery={query}
      />

      {/* Live Chat Drawer */}
      <LiveChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(!isChatOpen)}
        onOpenTicket={() => {
          setIsTicketOpen(true);
        }}
      />
    </>
  );
}
