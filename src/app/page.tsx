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

  // Flow states: 'input' -> 'found' -> 'confirmed'
  const [flowData, setFlowData] = useState<SupportFlowResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Currently selected question in the chat (null | 1 | 2 | 3)
  const [selectedQuestion, setSelectedQuestion] = useState<1 | 2 | 3 | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Switch between phone or email
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
        {/* Only show top header on step 1 & 2 to avoid clutter in chat */}
        {!isConfirmed && (
          <header className="app-header">
            <span className="brand-badge">Official Helpdesk</span>
            <h1 className="header-title">Welcome to Creator Labs Support</h1>
            <p className="header-subtitle">
              Find and verify your workshop order details
            </p>
          </header>
        )}

        <main className="support-card">
          {/* Step 1: Input Screen (Only Phone OR Email allowed) */}
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

          {/* Step 2: Latest Paid Order Display & Confirmation */}
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

          {/* Step 3: Clean, Sleek Interactive Support Chat */}
          {order && isConfirmed && (
            <div className="chat-container">
              {/* Header Bar */}
              <div className="chat-header-bar">
                <div className="chat-agent-info">
                  <div className="agent-avatar">🤖</div>
                  <div>
                    <div className="agent-name">{order.creatorName} Support</div>
                    <div className="agent-status">
                      <span className="agent-dot" /> Online Helpdesk
                    </div>
                  </div>
                </div>
                <span className="badge-paid">₹{order.amountPaid} Paid</span>
              </div>

              {/* Chat Conversation Flow */}
              <div className="chat-flow">
                {/* Initial Bot Greeting */}
                <div className="chat-bubble chat-bubble-bot">
                  Hi <strong>{order.customerName || 'there'}</strong>! 👋
                  <br />
                  I have verified your workshop order for <strong>{order.creatorName}</strong>.
                  <br />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '4px', display: 'block' }}>
                    How can I help you today? Please tap an option below:
                  </span>
                </div>

                {/* When User Selects Question 1 */}
                {selectedQuestion === 1 && (
                  <>
                    <div className="chat-bubble chat-bubble-user">
                      I want zoom link for the workshop
                    </div>

                    <div className="chat-bubble chat-bubble-bot">
                      {flowData.zoomLink ? (
                        <div>
                          <span>Here is your Zoom link for the workshop:</span>
                          <div className="resolution-box resolution-box-zoom">
                            <a
                              href={flowData.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-chat-zoom"
                            >
                              Join Zoom Meeting
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(flowData.zoomLink!, 'zoom')}
                              className="btn-chat-copy"
                            >
                              {copiedType === 'zoom' ? '✓ Link Copied!' : 'Copy Zoom Link'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          You will receive the Zoom link via WhatsApp one day before the webinar.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* When User Selects Question 2 */}
                {selectedQuestion === 2 && (
                  <>
                    <div className="chat-bubble chat-bubble-user">
                      I want whatsapp community link
                    </div>

                    <div className="chat-bubble chat-bubble-bot">
                      {flowData.whatsappCommunityLink ? (
                        <div>
                          <span>
                            Here is the official WhatsApp Community link for <strong>{order.creatorName}</strong>:
                          </span>
                          <div className="resolution-box resolution-box-wa">
                            <a
                              href={flowData.whatsappCommunityLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-chat-wa"
                            >
                              Join WhatsApp Community
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(flowData.whatsappCommunityLink!, 'wa')
                              }
                              className="btn-chat-copy"
                            >
                              {copiedType === 'wa' ? '✓ Link Copied!' : 'Copy Community Link'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          The WhatsApp community link is currently being refreshed by the creator team. Please check back shortly.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* When User Selects Question 3 */}
                {selectedQuestion === 3 && (
                  <>
                    <div className="chat-bubble chat-bubble-user">
                      I purchased the course didn’t receive the details
                    </div>

                    <div className="chat-bubble chat-bubble-bot">
                      <span>
                        For course access and curriculum details, please contact the creator team directly:
                      </span>
                      <div className="resolution-box resolution-box-support">
                        <div className="contact-item-row">
                          <span className="contact-item-label">Email:</span>
                          <a
                            href={`mailto:${flowData.creatorSupportEmail}`}
                            className="contact-item-link"
                          >
                            {flowData.creatorSupportEmail}
                          </a>
                        </div>

                        <div className="contact-item-row">
                          <span className="contact-item-label">Phone:</span>
                          <a
                            href={`tel:${flowData.creatorSupportPhone.replace(/[^\d+]/g, '')}`}
                            className="contact-item-link"
                          >
                            {flowData.creatorSupportPhone}
                          </a>
                        </div>

                        <div className="contact-help-text">
                          Please contact on this number or email, and the team will assist you with your course access.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Tappable Question Options */}
              <div className="chat-options-section">
                <span className="chat-options-header">
                  {selectedQuestion ? 'Ask another question' : 'Choose an option'}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedQuestion(1)}
                  className={`chat-option-btn ${selectedQuestion === 1 ? 'selected' : ''}`}
                >
                  <span>1. I want zoom link for the workshop</span>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuestion(2)}
                  className={`chat-option-btn ${selectedQuestion === 2 ? 'selected' : ''}`}
                >
                  <span>2. I want whatsapp community link</span>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuestion(3)}
                  className={`chat-option-btn ${selectedQuestion === 3 ? 'selected' : ''}`}
                >
                  <span>3. I purchased the course didn’t receive the details</span>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                </button>
              </div>

              {/* Start Over Button */}
              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
                style={{ marginTop: '10px' }}
              >
                Search Another Order
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
