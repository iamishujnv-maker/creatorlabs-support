'use client';

import React, { useState } from 'react';
import { SupportFlowResult } from '@/lib/mongodb';

export default function CreatorLabsSupportPage() {
  // Input mode: only ONE is allowed at a time ('phone' or 'email')
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow states:
  // 1. '!flowData' -> Input Screen
  // 2. 'flowData && !isConfirmed' -> Order Confirmation Screen
  // 3. 'isConfirmed && !selectedQuestion' -> Questions List Screen
  // 4. 'isConfirmed && selectedQuestion' -> Solution Screen
  const [flowData, setFlowData] = useState<SupportFlowResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<1 | 2 | 3 | null>(null);

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleModeChange = (mode: 'phone' | 'email') => {
    setInputMode(mode);
    setErrorMsg(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let queryValue = '';

    if (inputMode === 'phone') {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      queryValue = cleanDigits;
    } else {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      queryValue = trimmedEmail;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/lookup?query=${encodeURIComponent(queryValue)}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setFlowData(data.data);
        setIsConfirmed(false);
        setSelectedQuestion(null);
      } else {
        setErrorMsg(
          data.error || 'No paid registration found in the last 7 days.'
        );
        setFlowData(null);
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setFlowData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    setIsConfirmed(true);
    setSelectedQuestion(null);
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(identifier);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleReset = () => {
    setFlowData(null);
    setIsConfirmed(false);
    setSelectedQuestion(null);
    setErrorMsg(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const order = flowData?.order;

  return (
    <div className="page-wrapper">
      <div className="center-container">
        {/* Top Header shown on screens 1, 2, and 3 */}
        {!selectedQuestion && (
          <header className="app-header">
            <span className="brand-badge">Official Helpdesk</span>
            <h1 className="header-title">Welcome to Creator Labs Support</h1>
            <p className="header-subtitle">
              {isConfirmed && order
                ? `Support for ${order.creatorName}`
                : 'Find and verify your workshop order details'}
            </p>
          </header>
        )}

        <main className="support-card">
          {/* SCREEN 1: Input (Phone OR Email) */}
          {!flowData && (
            <form onSubmit={handleSearch}>
              <div className="toggle-wrapper">
                <span className="toggle-label">Search using</span>
                <div className="tab-toggle" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === 'phone'}
                    className={`tab-btn ${inputMode === 'phone' ? 'active' : ''}`}
                    onClick={() => handleModeChange('phone')}
                  >
                    Phone Number
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === 'email'}
                    className={`tab-btn ${inputMode === 'email' ? 'active' : ''}`}
                    onClick={() => handleModeChange('email')}
                  >
                    Email Address
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="alert-error" role="alert">
                  <span>{errorMsg}</span>
                </div>
              )}

              {inputMode === 'phone' ? (
                <div className="form-group">
                  <label htmlFor="phone-input" className="input-label">
                    Registered Mobile Number
                  </label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="phone-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="phone-input"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="email-input" className="input-label">
                    Registered Email Address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-field"
                    autoFocus
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Finding Order...' : 'Continue'}
              </button>
            </form>
          )}

          {/* SCREEN 2: Order Found -> Confirmation */}
          {order && !isConfirmed && (
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Confirm Your Order
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                }}
              >
                We found your latest registration in the last 7 days.
              </p>

              <div className="order-card-box">
                <div className="order-box-header">
                  <span className="order-box-title">Order Details</span>
                  <span className="order-tag">Paid</span>
                </div>

                <div className="order-item-row">
                  <span className="order-item-label">Creator Name</span>
                  <span className="order-item-value">{order.creatorName}</span>
                </div>

                <div className="order-item-row">
                  <span className="order-item-label">Domain</span>
                  <span className="order-item-value">{order.domain}</span>
                </div>

                <div className="order-item-row">
                  <span className="order-item-label">Registration Date</span>
                  <span className="order-item-value">
                    {formatDate(order.registrationDate)}
                  </span>
                </div>

                <div className="order-item-row">
                  <span className="order-item-label">Amount Paid</span>
                  <span className="order-item-value amount-text">
                    ₹{order.amountPaid}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmOrder}
                className="btn-confirm"
              >
                Yes, This Is My Order (Confirm)
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
              >
                Not My Order (Search Again)
              </button>
            </div>
          )}

          {/* SCREEN 3: List of Questions with Arrow (Non-conversational) */}
          {order && isConfirmed && !selectedQuestion && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#16a34a',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    display: 'inline-block',
                    marginBottom: '6px',
                  }}
                >
                  ✓ Order Verified
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  How can we help you?
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Select an issue below to get the solution.
                </p>
              </div>

              {/* Tappable Question List with Right Chevron Arrow */}
              <div className="questions-list">
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(1)}
                  className="question-item-btn"
                >
                  <span>1. I want zoom link for the workshop</span>
                  <span className="question-arrow">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuestion(2)}
                  className="question-item-btn"
                >
                  <span>2. I want whatsapp community link</span>
                  <span className="question-arrow">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuestion(3)}
                  className="question-item-btn"
                >
                  <span>3. I purchased the course didn’t receive the details</span>
                  <span className="question-arrow">&rarr;</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
                style={{ marginTop: '16px' }}
              >
                Search Another Order
              </button>
            </div>
          )}

          {/* SCREEN 4: Dedicated Solution Screen for the Selected Question */}
          {order && isConfirmed && selectedQuestion && (
            <div className="solution-view">
              {/* Back to questions bar */}
              <div className="support-nav-bar">
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  className="back-btn"
                >
                  &larr; Back to Questions
                </button>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: '#f1f5f9',
                    color: 'var(--text-secondary)',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                  }}
                >
                  {order.creatorName}
                </span>
              </div>

              {/* SOLUTION FOR QUESTION 1: ZOOM LINK */}
              {selectedQuestion === 1 && (
                <div>
                  <div className="solution-header">
                    <h2 className="solution-title">Zoom Link for Workshop</h2>
                    <p className="solution-desc">Live session meeting room link</p>
                  </div>

                  <div className="solution-card-body" style={{ marginTop: '14px' }}>
                    {flowData.zoomLink ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                          Here is your Zoom link for the live session:
                        </p>

                        <a
                          href={flowData.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="solution-btn-zoom"
                        >
                          Join Zoom Meeting
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(flowData.zoomLink!, 'zoom')}
                          className="solution-btn-copy"
                        >
                          {copiedType === 'zoom' ? '✓ Link Copied!' : 'Copy Zoom Link'}
                        </button>
                      </div>
                    ) : (
                      <div className="solution-notice">
                        You will receive the Zoom link via WhatsApp one day before the webinar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SOLUTION FOR QUESTION 2: WHATSAPP COMMUNITY LINK */}
              {selectedQuestion === 2 && (
                <div>
                  <div className="solution-header">
                    <h2 className="solution-title">WhatsApp Community Link</h2>
                    <p className="solution-desc">Official workshop group for {order.creatorName}</p>
                  </div>

                  <div className="solution-card-body" style={{ marginTop: '14px' }}>
                    {flowData.whatsappCommunityLink ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                          Join the official WhatsApp Community to get workshop materials, worksheets, and live announcements:
                        </p>

                        <a
                          href={flowData.whatsappCommunityLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="solution-btn-wa"
                        >
                          Join WhatsApp Community
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(flowData.whatsappCommunityLink!, 'wa')
                          }
                          className="solution-btn-copy"
                        >
                          {copiedType === 'wa' ? '✓ Link Copied!' : 'Copy Community Link'}
                        </button>
                      </div>
                    ) : (
                      <div className="solution-notice">
                        The WhatsApp community link is currently being refreshed by the creator team. Please check back shortly.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SOLUTION FOR QUESTION 3: COURSE DETAILS / CREATOR CONTACT */}
              {selectedQuestion === 3 && (
                <div>
                  <div className="solution-header">
                    <h2 className="solution-title">Course Access & Details</h2>
                    <p className="solution-desc">Direct support for {order.creatorName}</p>
                  </div>

                  <div className="solution-card-body" style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                      For course access and curriculum details, please contact the creator team directly:
                    </p>

                    <div className="solution-contact-card">
                      <div className="contact-row">
                        <span className="contact-label">Email:</span>
                        <a
                          href={`mailto:${flowData.creatorSupportEmail}`}
                          className="contact-value-link"
                        >
                          {flowData.creatorSupportEmail}
                        </a>
                      </div>

                      <div className="contact-row">
                        <span className="contact-label">Phone:</span>
                        <a
                          href={`tel:${flowData.creatorSupportPhone.replace(/[^\d+]/g, '')}`}
                          className="contact-value-link"
                        >
                          {flowData.creatorSupportPhone}
                        </a>
                      </div>

                      <div className="contact-instruction">
                        Please contact on this number or email, and the team will assist you with your course access.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Navigation */}
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="btn-ghost"
                style={{ marginTop: '8px' }}
              >
                &larr; Back to Other Questions
              </button>
            </div>
          )}
        </main>

        <footer className="app-footer">
          <span>Official Creator Labs Helpdesk</span>
        </footer>
      </div>
    </div>
  );
}
