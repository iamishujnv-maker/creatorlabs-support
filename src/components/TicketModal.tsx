'use client';

import React, { useState } from 'react';
import { Registration, SupportTicket } from '@/types';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRegistration?: Registration | null;
  defaultQuery?: string;
}

export default function TicketModal({ isOpen, onClose, defaultRegistration, defaultQuery }: Props) {
  const [name, setName] = useState(defaultRegistration?.user_name || '');
  const [email, setEmail] = useState(defaultRegistration?.user_email || (defaultQuery?.includes('@') ? defaultQuery : ''));
  const [phone, setPhone] = useState(defaultRegistration?.user_phone || (!defaultQuery?.includes('@') ? defaultQuery || '' : ''));
  const [queryType, setQueryType] = useState<SupportTicket['query_type']>('whatsapp_link');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<SupportTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          user_phone: phone,
          workshop_id: defaultRegistration?.workshop_id,
          query_type: queryType,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessTicket(data.ticket);
      } else {
        setErrorMsg(data.error || 'Failed to submit ticket');
      }
    } catch {
      setErrorMsg('Network error while submitting ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {successTicket ? 'Ticket Created' : 'Raise Support Request'}
          </h3>
          <button type="button" onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {successTicket ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={54} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>We’ve Received Your Request!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your ticket reference is <strong>#{successTicket.id}</strong>. Our Creator Labs support desk will reach out to you on <strong>{successTicket.user_phone}</strong> or <strong>{successTicket.user_email}</strong> shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="form-control"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Query Category</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value as any)}
                className="form-control"
              >
                <option value="whatsapp_link">Did not receive WhatsApp Community link / Expired</option>
                <option value="zoom_link">Zoom link not working / Need Meeting Passcode</option>
                <option value="payment_issue">Payment deducted but workshop not showing</option>
                <option value="reschedule">Request to switch workshop batch / date</option>
                <option value="other">Other question for Creator Labs team</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Explain your issue in detail</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe what happened (e.g. UPI transaction ID, creator name, or screenshot details)..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                <Send size={15} />
                <span>{submitting ? 'Submitting...' : 'Submit Support Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
