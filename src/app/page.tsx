'use client';

import React, { useState } from 'react';
import { LatestPaidOrderResult } from '@/lib/mongodb';

export default function WorkshopSupportPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flow states: 'input' -> 'found' -> 'confirmed'
  const [order, setOrder] = useState<LatestPaidOrderResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || query.trim().length < 3) {
      setErrorMsg('Please enter a valid 10-digit mobile number or email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/lookup?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setIsConfirmed(false);
      } else {
        setErrorMsg(
          data.error || 'No paid registration found for this phone number or email.'
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
    <div className="page-container">
      <main className="app-card">
        {/* Step 1: Input Screen (when no order is loaded) */}
        {!order && (
          <>
            <div className="card-header">
              <h1 className="card-title">Workshop Support</h1>
              <p className="card-subtitle">
                Enter your registered phone number or email to view your workshop registration.
              </p>
            </div>

            <div className="card-body">
              {errorMsg && <div className="alert-error">{errorMsg}</div>}

              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label htmlFor="user-input" className="form-label">
                    Mobile Number or Email
                  </label>
                  <input
                    id="user-input"
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. 9876543210 or yourname@gmail.com"
                    className="form-input"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Checking...' : 'Find My Registration'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Step 2: Order Found -> Show details and ask for Confirmation */}
        {order && !isConfirmed && (
          <>
            <div className="card-header">
              <h2 className="card-title">Confirm Your Order</h2>
              <p className="card-subtitle">
                Please check the details below and confirm if this is your registration.
              </p>
            </div>

            <div className="card-body">
              <div className="order-summary">
                <div className="order-row">
                  <span className="order-label">Creator Name</span>
                  <span className="order-value">{order.creatorName}</span>
                </div>

                <div className="order-row">
                  <span className="order-label">Domain</span>
                  <span className="order-value">{order.domain}</span>
                </div>

                <div className="order-row">
                  <span className="order-label">Registration Date</span>
                  <span className="order-value">{formatDate(order.registrationDate)}</span>
                </div>

                <div className="order-row">
                  <span className="order-label">Amount Paid</span>
                  <span className="order-value amount-highlight">
                    ₹{order.amountPaid}
                  </span>
                </div>

                {order.customerName && (
                  <div className="order-row">
                    <span className="order-label">Registered Name</span>
                    <span className="order-value">{order.customerName}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmed(true)}
                className="btn btn-success"
              >
                Yes, This Is My Order (Confirm)
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                Not My Order (Search Again)
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirmed State (Waiting for next prompt options) */}
        {order && isConfirmed && (
          <>
            <div className="card-header">
              <h2 className="card-title" style={{ color: '#16a34a' }}>
                ✓ Order Confirmed
              </h2>
              <p className="card-subtitle">
                Your order with <strong>{order.creatorName}</strong> has been verified.
              </p>
            </div>

            <div className="card-body">
              <div className="alert-success">
                Registration verified for <strong>{order.customerName || order.customerPhone}</strong>.
              </div>

              <div className="order-summary" style={{ marginBottom: '16px' }}>
                <div className="order-row">
                  <span className="order-label">Creator</span>
                  <span className="order-value">{order.creatorName}</span>
                </div>
                <div className="order-row">
                  <span className="order-label">Domain</span>
                  <span className="order-value">{order.domain}</span>
                </div>
                <div className="order-row">
                  <span className="order-label">Amount</span>
                  <span className="order-value amount-highlight">₹{order.amountPaid}</span>
                </div>
              </div>

              {/* Ready for the options to be added in the next prompt */}
              <div
                style={{
                  padding: '16px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#475569',
                  textAlign: 'center',
                }}
              >
                Support options will be displayed here in the next step.
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ marginTop: '16px' }}
              >
                Search Another Number
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
