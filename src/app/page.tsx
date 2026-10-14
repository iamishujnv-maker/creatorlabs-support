'use client';

import React, { useState } from 'react';
import { SupportFlowResult } from '@/lib/mongodb';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'zoom' | 'whatsapp' | 'course_support';
  data?: any;
}

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

  // Chat conversation state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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
    if (!flowData) return;
    setIsConfirmed(true);

    // Initialize the chat with the bot's greeting
    setChatMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Hi ${flowData.order.customerName || 'there'}! 👋 I have verified your order for ${flowData.order.creatorName}. How can I help you today?`,
        type: 'text',
      },
    ]);
  };

  // Handle clicking one of the 3 chat questions
  const handleSelectQuestion = (questionId: 1 | 2 | 3) => {
    if (!flowData) return;

    if (questionId === 1) {
      // 1. I want zoom link for the workshop
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'I want zoom link for the workshop',
      };

      const botMsg: ChatMessage = flowData.zoomLink
        ? {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'Here is your Zoom link for the workshop:',
            type: 'zoom',
            data: { zoomLink: flowData.zoomLink },
          }
        : {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'You will receive the Zoom link via WhatsApp one day before the webinar.',
            type: 'text',
          };

      setChatMessages((prev) => [...prev, userMsg, botMsg]);
    } else if (questionId === 2) {
      // 2. I want whatsapp community link
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'I want whatsapp community link',
      };

      const botMsg: ChatMessage = flowData.whatsappCommunityLink
        ? {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `Here is the official WhatsApp Community link for ${flowData.order.creatorName}:`,
            type: 'whatsapp',
            data: { whatsappLink: flowData.whatsappCommunityLink },
          }
        : {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'The WhatsApp community link is currently being refreshed by the creator team. Please check back shortly.',
            type: 'text',
          };

      setChatMessages((prev) => [...prev, userMsg, botMsg]);
    } else if (questionId === 3) {
      // 3. I purchased the course didn't receive the details
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'I purchased the course didn’t receive the details',
      };

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `For course access and curriculum details, please contact the creator team directly:`,
        type: 'course_support',
        data: {
          creatorName: flowData.order.creatorName,
          email: flowData.creatorSupportEmail,
          phone: flowData.creatorSupportPhone,
        },
      };

      setChatMessages((prev) => [...prev, userMsg, botMsg]);
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(identifier);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleReset = () => {
    setFlowData(null);
    setIsConfirmed(false);
    setChatMessages([]);
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
        {/* Header */}
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

          {/* Step 3: Interactive Chat Screen */}
          {order && isConfirmed && (
            <div className="chat-window">
              {/* Chat Top Bar */}
              <div className="chat-top-bar">
                <div className="chat-agent-info">
                  <div className="agent-avatar">🤖</div>
                  <div>
                    <div className="agent-name">{order.creatorName} Assistant</div>
                    <div className="agent-status">
                      <span className="agent-dot" /> Online • Support Bot
                    </div>
                  </div>
                </div>
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
                  ₹{order.amountPaid} Paid
                </span>
              </div>

              {/* Chat Messages Stream */}
              <div className="messages-stream">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`msg-bubble ${
                      msg.sender === 'user' ? 'msg-user' : 'msg-bot'
                    }`}
                  >
                    <div>{msg.text}</div>

                    {/* Question 1: Zoom Link Response */}
                    {msg.type === 'zoom' && msg.data?.zoomLink && (
                      <div className="chat-action-card">
                        <a
                          href={msg.data.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-zoom"
                        >
                          Join Zoom Meeting
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.data.zoomLink, 'zoom')}
                          className="btn-copy"
                        >
                          {copiedType === 'zoom' ? '✓ Link Copied!' : 'Copy Zoom Link'}
                        </button>
                      </div>
                    )}

                    {/* Question 2: WhatsApp Community Link Response */}
                    {msg.type === 'whatsapp' && msg.data?.whatsappLink && (
                      <div className="chat-action-card">
                        <a
                          href={msg.data.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp"
                        >
                          Join WhatsApp Community
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(msg.data.whatsappLink, 'wa')
                          }
                          className="btn-copy"
                        >
                          {copiedType === 'wa' ? '✓ Link Copied!' : 'Copy Community Link'}
                        </button>
                      </div>
                    )}

                    {/* Question 3: Course Support Details Response */}
                    {msg.type === 'course_support' && msg.data && (
                      <div className="contact-details-box">
                        <div className="contact-row">
                          <span className="contact-label">Email:</span>
                          <a
                            href={`mailto:${msg.data.email}`}
                            className="contact-link"
                          >
                            {msg.data.email}
                          </a>
                        </div>

                        <div className="contact-row">
                          <span className="contact-label">Phone:</span>
                          <a
                            href={`tel:${msg.data.phone.replace(/[^\d+]/g, '')}`}
                            className="contact-link"
                          >
                            {msg.data.phone}
                          </a>
                        </div>

                        <div className="contact-note">
                          Please contact on this number or email, and the team will assist you with your course access.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Questions Section */}
              <div className="quick-questions-wrapper">
                <span className="quick-questions-title">Choose an option</span>

                <button
                  type="button"
                  onClick={() => handleSelectQuestion(1)}
                  className="question-chip"
                >
                  <span>1. I want zoom link for the workshop</span>
                  <span className="chip-arrow">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuestion(2)}
                  className="question-chip"
                >
                  <span>2. I want whatsapp community link</span>
                  <span className="chip-arrow">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuestion(3)}
                  className="question-chip"
                >
                  <span>3. I purchased the course didn’t receive the details</span>
                  <span className="chip-arrow">&rarr;</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
                style={{ marginTop: '8px' }}
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
