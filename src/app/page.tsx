'use client';

import React, { useState } from 'react';
import { LatestPaidOrderResult } from '@/lib/mongodb';

export default function CreatorLabsSupportPage() {
  // Input mode: only ONE is allowed at a time ('phone' or 'email')
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow states: 'input' -> 'found' -> 'confirmed'
  const [order, setOrder] = useState<LatestPaidOrderResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

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

      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setIsConfirmed(false);
      } else {
        setErrorMsg(
          data.error || 'No paid registration found. Please check and try again.'
        );
        setOrder(null);
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setIsConfirmed(false);
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

  return (
    <div className="page-wrapper">
      {/* Sleek, simple header */}
      <header className="app-header">
        <span className="brand-badge">Official Helpdesk</span>
        <h1 className="header-title">Welcome to Creator Labs Support</h1>
        <p className="header-subtitle">
          Find and verify your workshop order details
        </p>
      </header>

      <main className="support-card">
        {/* Step 1: Input Screen (Only Phone OR Email allowed) */}
        {!order && (
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
              Please verify your workshop registration details below.
            </p>

            <div className="order-card-box">
              <div className="order-box-header">
                <span className="order-box-title">Latest Paid Order</span>
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

        {/* Step 3: Confirmed State */}
        {order && isConfirmed && (
          <div>
            <div className="alert-success">
              <span>✓ Order Confirmed for {order.creatorName}</span>
            </div>

            <div className="order-card-box">
              <div className="order-item-row">
                <span className="order-item-label">Creator</span>
                <span className="order-item-value">{order.creatorName}</span>
              </div>
              <div className="order-item-row">
                <span className="order-item-label">Domain</span>
                <span className="order-item-value">{order.domain}</span>
              </div>
              <div className="order-item-row">
                <span className="order-item-label">Amount</span>
                <span className="order-item-value amount-text">
                  ₹{order.amountPaid}
                </span>
              </div>
            </div>

            {/* Placeholder where further support options will be added in next prompt */}
            <div className="next-step-box">
              Support options will appear here in the next step.
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
      </main>
    </div>
  );
}
