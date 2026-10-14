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

  // Data state & active question
  const [flowData, setFlowData] = useState<SupportFlowResult | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<1 | 2 | 3 | null>(null);
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
        setActiveQuestion(null);
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

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(identifier);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleReset = () => {
    setFlowData(null);
    setActiveQuestion(null);
    setErrorMsg(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const order = flowData?.order;

  return (
    <div className="page-wrapper">
      <div className="center-container">
        {/* Main Card */}
        <main className="support-card">
          {/* SCREEN 1: Input (Phone OR Email) */}
          {!flowData && (
            <>
              <header className="app-header">
                <h1 className="header-title">Welcome to Creator Labs Support</h1>
                <p className="header-subtitle">
                  Enter your registered phone number or email
                </p>
              </header>

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
            </>
          )}

          {/* SCREEN 2: Unified Single Support Screen (No extra blocks, clean structure) */}
          {order && !activeQuestion && (
            <div>
              {/* Top: Thank you note with creator name, domain, and date and nothing else */}
              <div className="registration-info-top">
                <h2 className="reg-thankyou-title">
                  Thank you for registering with {order.creatorName}
                </h2>
                <p className="reg-meta-sub">
                  {order.domain} • {formatDate(order.registrationDate)}
                </p>
              </div>

              <div className="divider-line" />

              {/* Heading: What do you need help with? */}
              <h3 className="questions-section-title">
                What do you need help with?
              </h3>

              {/* Questions List */}
              <div className="clean-questions-list">
                <button
                  type="button"
                  onClick={() => setActiveQuestion(1)}
                  className="clean-question-btn"
                >
                  <span>1. I want zoom link for the workshop</span>
                  <span className="arrow-icon">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestion(2)}
                  className="clean-question-btn"
                >
                  <span>2. I want whatsapp community link</span>
                  <span className="arrow-icon">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestion(3)}
                  className="clean-question-btn"
                >
                  <span>3. I purchased the course didn’t receive the details</span>
                  <span className="arrow-icon">&rarr;</span>
                </button>
              </div>

              {/* Bottom switch number link */}
              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
              >
                Search Another Number / Email
              </button>
            </div>
          )}

          {/* DEDICATED SOLUTION SCREEN FOR SELECTED QUESTION */}
          {order && activeQuestion && (
            <div className="solution-container">
              <button
                type="button"
                onClick={() => setActiveQuestion(null)}
                className="solution-back-btn"
              >
                &larr; Back to Questions
              </button>

              {/* Question 1: Zoom Link */}
              {activeQuestion === 1 && (
                <div>
                  <h3 className="solution-heading">Zoom Link for Workshop</h3>
                  <p className="solution-subline">{order.creatorName}</p>

                  <div className="solution-body-card">
                    {flowData.zoomLink ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                          Here is your Zoom link for the live session:
                        </p>

                        <a
                          href={flowData.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="solution-action-btn-zoom"
                        >
                          Join Zoom Meeting
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(flowData.zoomLink!, 'zoom')}
                          className="copy-button"
                        >
                          {copiedType === 'zoom' ? '✓ Link Copied!' : 'Copy Zoom Link'}
                        </button>
                      </div>
                    ) : (
                      <div className="solution-message-box">
                        You will receive the Zoom link via WhatsApp one day before the webinar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question 2: WhatsApp Community */}
              {activeQuestion === 2 && (
                <div>
                  <h3 className="solution-heading">WhatsApp Community Link</h3>
                  <p className="solution-subline">{order.creatorName}</p>

                  <div className="solution-body-card">
                    {flowData.whatsappCommunityLink ? (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                          Join the official WhatsApp Community for updates and materials:
                        </p>

                        <a
                          href={flowData.whatsappCommunityLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="solution-action-btn-wa"
                        >
                          Join WhatsApp Community
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(flowData.whatsappCommunityLink!, 'wa')
                          }
                          className="copy-button"
                        >
                          {copiedType === 'wa' ? '✓ Link Copied!' : 'Copy Community Link'}
                        </button>
                      </div>
                    ) : (
                      <div className="solution-message-box">
                        The WhatsApp community link is currently being refreshed by the creator team. Please check back shortly.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question 3: Course Support */}
              {activeQuestion === 3 && (
                <div>
                  <h3 className="solution-heading">Course Access & Details</h3>
                  <p className="solution-subline">{order.creatorName}</p>

                  <div className="solution-body-card">
                    <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                      For course access and curriculum details, please contact the creator team directly:
                    </p>

                    <div className="contacts-wrapper">
                      <div className="contact-row-item">
                        <span className="contact-item-key">Email:</span>
                        <a
                          href={`mailto:${flowData.creatorSupportEmail}`}
                          className="contact-item-val"
                        >
                          {flowData.creatorSupportEmail}
                        </a>
                      </div>

                      <div className="contact-row-item">
                        <span className="contact-item-key">Phone:</span>
                        <a
                          href={`tel:${flowData.creatorSupportPhone.replace(/[^\d+]/g, '')}`}
                          className="contact-item-val"
                        >
                          {flowData.creatorSupportPhone}
                        </a>
                      </div>

                      <div className="contact-help-note">
                        Please contact on this number or email, and the team will assist you with your course access.
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
