'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Send, Bot, User, Check, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenTicket: () => void;
}

export default function LiveChatWidget({ isOpen, onClose, onOpenTicket }: Props) {
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || 'default';

  const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string; time: string }[]>([
    {
      sender: 'bot',
      text: 'Hi there! 👋 Welcome to Creator Labs Support. How can we assist you today?',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  // Dynamically load Tawk.to if property ID is supplied
  useEffect(() => {
    if (!propertyId) return;

    // Load Tawk.to script
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.head.appendChild(s1);

    return () => {
      s1.remove();
    };
  }, [propertyId, widgetId]);

  // If official Tawk.to is configured, let Tawk.to handle the widget
  if (propertyId) {
    return null; // Tawk.to mounts its own floating bubble
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onClose} // in parent, toggles open
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99,
          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '58px',
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45)',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        aria-label="Open Live Chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, time: 'Just now' },
    ]);

    // Intelligent auto-response for common webinar / creator queries
    setTimeout(() => {
      let reply = 'Thank you for reaching out! A Creator Labs specialist will review this shortly.';
      const lower = userMsg.toLowerCase();

      if (lower.includes('whatsapp') || lower.includes('group') || lower.includes('community')) {
        reply = 'For WhatsApp community access, please enter your registered phone number in our search bar on the homepage. You will see an instant "Join WhatsApp Community" link!';
      } else if (lower.includes('zoom') || lower.includes('password') || lower.includes('passcode') || lower.includes('join')) {
        reply = 'Zoom links unlock 24 hours prior to the workshop time for security reasons. If your session is today, look up your registration on the homepage to find the live Zoom room & passcode!';
      } else if (lower.includes('refund') || lower.includes('payment') || lower.includes('not working')) {
        reply = 'For payment deductions or refund inquiries, please click "Raise a Support Ticket" so our financial ops team can look up your bank/UPI transaction ID immediately.';
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply, time: 'Just now' },
      ]);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        height: '520px',
        background: '#0f172a',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      className="animate-fade-in"
    >
      {/* Chat Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Creator Labs Support
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              In-House Team Online
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              background: m.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              padding: '0.7rem 0.95rem',
              borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              fontSize: '0.875rem',
              lineHeight: 1.45,
            }}
          >
            <div>{m.text}</div>
            <div
              style={{
                fontSize: '0.68rem',
                color: m.sender === 'user' ? '#c7d2fe' : 'var(--text-subtle)',
                marginTop: '0.3rem',
                textAlign: 'right',
              }}
            >
              {m.time}
            </div>
          </div>
        ))}
      </div>

      {/* Escalation bar */}
      <div
        style={{
          padding: '0.5rem 0.9rem',
          background: 'rgba(99, 102, 241, 0.08)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Need human assistance?</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenTicket();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a5b4fc',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Raise an Official Ticket
        </button>
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '0.75rem',
          background: '#0b111e',
          display: 'flex',
          gap: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.9rem',
            color: '#fff',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-md)' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
