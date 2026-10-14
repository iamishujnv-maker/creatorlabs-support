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

  // Copy feedback states
  const [copiedType, setCopiedType] = useState<'wa' | 'zoom' | null>(null);

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

  const handleReset = () => {
    setFlowData(null);
    setIsConfirmed(false);
    setErrorMsg(null);
  };

  const copyToClipboard = (text: string, type: 'wa' | 'zoom') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
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
        {/* Sleek header */}
        <header className="app-header">
          <span className="brand-badge">Official Helpdesk</span>
          <h1 className="header-title">Welcome to Creator Labs Support</h1>
          <p className="header-subtitle">
            Find and verify your workshop order details
          </p>
        </header>

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

          {/* Step 2: Latest Paid Order Display & Confirmation (Order in last 7 days) */}
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
                onClick={() => setIsConfirmed(true)}
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

          {/* Step 3 & 4: Confirmed State -> Show WhatsApp Community & Zoom Links */}
          {order && isConfirmed && (
            <div>
              <div className="alert-success">
                <span>✓ Order Verified for {order.creatorName}</span>
              </div>

              <div className="resource-cards-list">
                {/* 3. WhatsApp Community Link (from constants table) */}
                <div className="resource-card resource-card-wa">
                  <div className="resource-header">
                    <span className="resource-title" style={{ color: '#16a34a' }}>
                      💬 WhatsApp Community
                    </span>
                    <span className="resource-status-badge" style={{ color: '#16a34a' }}>
                      {flowData.whatsappCommunityLink ? 'Link Available' : 'Pending'}
                    </span>
                  </div>
                  <p className="resource-desc">
                    Join the official attendee group to get workshop materials, worksheets, and live announcements.
                  </p>

                  {flowData.whatsappCommunityLink ? (
                    <div>
                      <a
                        href={flowData.whatsappCommunityLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp"
                      >
                        Join WhatsApp Community
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(flowData.whatsappCommunityLink!, 'wa')
                        }
                        className="btn-copy"
                      >
                        {copiedType === 'wa' ? '✓ Link Copied!' : 'Copy Group Link'}
                      </button>
                    </div>
                  ) : (
                    <div className="resource-notice">
                      Community link is being refreshed by the creator team. Please check back shortly.
                    </div>
                  )}
                </div>

                {/* 4. Zoom Link (from messages table filtered by phone & domain) */}
                <div className="resource-card resource-card-zoom">
                  <div className="resource-header">
                    <span className="resource-title" style={{ color: '#2563eb' }}>
                      🎥 Zoom Webinar Room
                    </span>
                    <span className="resource-status-badge" style={{ color: '#2563eb' }}>
                      {flowData.zoomLink ? 'Ready to Join' : 'Broadcast Pending'}
                    </span>
                  </div>

                  {flowData.zoomLink ? (
                    <div>
                      <p className="resource-desc">
                        Here is your live session join link.
                      </p>

                      <a
                        href={flowData.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-zoom"
                      >
                        Join Zoom Meeting
                      </a>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(flowData.zoomLink!, 'zoom')}
                        className="btn-copy"
                      >
                        {copiedType === 'zoom' ? '✓ Link Copied!' : 'Copy Zoom Link'}
                      </button>
                    </div>
                  ) : (
                    <div className="resource-notice">
                      The Zoom link has not been sent yet. The creator broadcasts the Zoom room via WhatsApp & SMS a few hours before the live session starts.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
                style={{ marginTop: '14px' }}
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
