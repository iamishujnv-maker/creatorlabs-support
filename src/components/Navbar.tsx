'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Headphones, ExternalLink } from 'lucide-react';

export default function Navbar({ onOpenChat }: { onOpenChat?: () => void }) {
  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link href="/" className="brand-logo">
            <div className="brand-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <span>Creator Labs</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                Support
              </span>
            </div>
            <span className="brand-badge">Helpdesk</span>
          </Link>

          <nav className="nav-links">
            <Link href="/admin" className="nav-btn-admin">
              <ShieldCheck size={16} />
              <span>Admin Console</span>
            </Link>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="btn-secondary"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <Headphones size={15} />
                <span>Live Support</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
