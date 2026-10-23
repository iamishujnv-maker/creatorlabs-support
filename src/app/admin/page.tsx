'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Workshop, Registration, SupportTicket } from '@/types';
import {
  Users,
  Video,
  LifeBuoy,
  IndianRupee,
  Search,
  Edit2,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'workshops' | 'attendees' | 'tickets' | 'config'>('workshops');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalWorkshops: 0,
    totalRevenue: 0,
    openTickets: 0,
  });
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Search & Filter
  const [attendeeFilter, setAttendeeFilter] = useState('');

  // Editing Workshop
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [editZoomLink, setEditZoomLink] = useState('');
  const [editZoomPasscode, setEditZoomPasscode] = useState('');
  const [editWhatsAppLink, setEditWhatsAppLink] = useState('');
  const [savingWorkshop, setSavingWorkshop] = useState(false);

  // Resolving Ticket
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Support Bot Config
  const [lookbackDays, setLookbackDays] = useState(14);
  const [liveWindowMinutes, setLiveWindowMinutes] = useState(30);
  const [centralSupportWhatsapp, setCentralSupportWhatsapp] = useState('918949451726');
  const [supportSlaText, setSupportSlaText] = useState('24–48 hours');
  const [copyWelcomeGreeting, setCopyWelcomeGreeting] = useState("Hi! I'm the Creator Lab help assistant.");
  const [copyWelcomePrompt, setCopyWelcomePrompt] = useState("Enter the phone number or email you used to pay. I'll find your workshop.");
  const [copyEscalationText, setCopyEscalationText] = useState("Message us on WhatsApp and our team will get back to you within {sla}. Your booking details are already in the message.");
  const [copyClosingMessage, setCopyClosingMessage] = useState("Glad that helped! Enjoy your workshop! If anything else comes up, I’m right here.");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, cfgRes] = await Promise.all([
        fetch('/api/admin'),
        fetch('/api/admin/config').catch(() => null),
      ]);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setWorkshops(data.workshops);
        setRegistrations(data.registrations);
        setTickets(data.tickets);
      }

      if (cfgRes && cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.success && cfgData.config) {
          const c = cfgData.config;
          if (c.LOOKBACK_DAYS !== undefined) setLookbackDays(c.LOOKBACK_DAYS);
          if (c.LIVE_WINDOW_MINUTES !== undefined) setLiveWindowMinutes(c.LIVE_WINDOW_MINUTES);
          if (c.CENTRAL_SUPPORT_WHATSAPP) setCentralSupportWhatsapp(c.CENTRAL_SUPPORT_WHATSAPP);
          if (c.SUPPORT_SLA_TEXT) setSupportSlaText(c.SUPPORT_SLA_TEXT);
          if (c.copy?.welcomeGreeting) setCopyWelcomeGreeting(c.copy.welcomeGreeting);
          if (c.copy?.welcomePrompt) setCopyWelcomePrompt(c.copy.welcomePrompt);
          if (c.copy?.escalationText) setCopyEscalationText(c.copy.escalationText);
          if (c.copy?.closingMessage) setCopyClosingMessage(c.copy.closingMessage);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LOOKBACK_DAYS: Number(lookbackDays),
          LIVE_WINDOW_MINUTES: Number(liveWindowMinutes),
          CENTRAL_SUPPORT_WHATSAPP: centralSupportWhatsapp.trim(),
          SUPPORT_SLA_TEXT: supportSlaText.trim(),
          copy: {
            welcomeGreeting: copyWelcomeGreeting,
            welcomePrompt: copyWelcomePrompt,
            escalationText: copyEscalationText,
            closingMessage: copyClosingMessage,
          },
        }),
      });

      if (res.ok) {
        setConfigSuccessMsg('Support Bot configuration saved successfully! Active immediately.');
        setTimeout(() => setConfigSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (ws: Workshop) => {
    setEditingWorkshop(ws);
    setEditZoomLink(ws.zoom_link);
    setEditZoomPasscode(ws.zoom_passcode || '');
    setEditWhatsAppLink(ws.whatsapp_link);
  };

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkshop) return;
    setSavingWorkshop(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_workshop',
          id: editingWorkshop.id,
          updates: {
            zoom_link: editZoomLink,
            zoom_passcode: editZoomPasscode,
            whatsapp_link: editWhatsAppLink,
          },
        }),
      });

      if (res.ok) {
        setEditingWorkshop(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update workshop:', err);
    } finally {
      setSavingWorkshop(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_ticket',
          id: ticketId,
          status,
          resolutionNotes: resolutionNote || undefined,
        }),
      });

      if (res.ok) {
        setResolvingTicketId(null);
        setResolutionNote('');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (!attendeeFilter) return true;
    const term = attendeeFilter.toLowerCase();
    return (
      r.user_name.toLowerCase().includes(term) ||
      r.user_email.toLowerCase().includes(term) ||
      r.user_phone.includes(term) ||
      r.payment_id.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="page-background" />
      <Navbar />

      <main className="container" style={{ paddingBottom: '4rem' }}>
        <div className="admin-header">
          <div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                marginBottom: '0.5rem',
              }}
            >
              <ArrowLeft size={14} /> Back to User Support Portal
            </Link>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800 }}>Creator Labs Operations Desk</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time workshop link updates, attendee lookups, and support ticket resolutions.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#818cf8', marginBottom: '0.5rem' }}>
              <Users size={20} />
              <span className="stat-label">Registrations</span>
            </div>
            <div className="stat-num">{stats.totalRegistrations}</div>
            <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Across All Active Creators</span>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <Video size={20} />
              <span className="stat-label">Webinars</span>
            </div>
            <div className="stat-num">{stats.totalWorkshops}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configured in DB</span>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185', marginBottom: '0.5rem' }}>
              <LifeBuoy size={20} />
              <span className="stat-label">Open Tickets</span>
            </div>
            <div className="stat-num" style={{ color: stats.openTickets > 0 ? '#fb7185' : 'inherit' }}>
              {stats.openTickets}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending escalation</span>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', marginBottom: '0.5rem' }}>
              <IndianRupee size={20} />
              <span className="stat-label">Paid Revenue</span>
            </div>
            <div className="stat-num">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meta Ad Gross</span>
          </div>
        </div>

        {/* Nav Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('workshops')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'workshops' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'workshops' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Video size={16} />
            <span>Manage Workshop Links ({workshops.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendees')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'attendees' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'attendees' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Users size={16} />
            <span>Attendees Roster ({registrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tickets' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'tickets' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LifeBuoy size={16} />
            <span>Support Tickets ({tickets.length})</span>
            {stats.openTickets > 0 && (
              <span
                style={{
                  background: '#f43f5e',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stats.openTickets}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'config' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'config' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Settings size={16} />
            <span>Support Bot Config</span>
          </button>
        </div>

        {/* Tab 1: Workshop Links Management */}
        {activeTab === 'workshops' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Workshops & Access Links</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Updating links here immediately reflects on the attendee self-serve portal.
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Creator & Workshop</th>
                    <th>Date & Time</th>
                    <th>WhatsApp Group Link</th>
                    <th>Zoom Room & Passcode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((ws) => (
                    <tr key={ws.id}>
                      <td>
                        <strong style={{ display: 'block', color: 'var(--text-main)' }}>{ws.title}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {ws.creator?.name} • {ws.creator?.brand_name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {new Date(ws.start_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(ws.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <a
                          href={ws.whatsapp_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4ade80', fontSize: '0.825rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <span>{ws.whatsapp_link.substring(0, 32)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <a
                            href={ws.zoom_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#60a5fa', fontSize: '0.825rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <span>{ws.zoom_link.substring(0, 30)}...</span>
                            <ExternalLink size={12} />
                          </a>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                            Code: {ws.zoom_passcode || 'None'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ws)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                        >
                          <Edit2 size={13} />
                          <span>Edit Links</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Attendees Search & Roster */}
        {activeTab === 'attendees' && (
          <div className="data-table-card">
            <div className="table-header">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
                <Search size={18} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={attendeeFilter}
                  onChange={(e) => setAttendeeFilter(e.target.value)}
                  placeholder="Filter attendees by name, phone, email, or payment ID..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                    width: '100%',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {filteredRegistrations.length} of {registrations.length}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Attendee Name</th>
                    <th>Contact (Phone & Email)</th>
                    <th>Workshop</th>
                    <th>Payment ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <strong>{reg.user_name}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{reg.user_phone}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{reg.user_email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {reg.workshop?.title || reg.workshop_id}
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>{reg.payment_id}</code>
                      </td>
                      <td>
                        <span className="status-badge status-confirmed">
                          ₹{reg.amount_paid} • {reg.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="data-table-card">
            <div className="table-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>In-House Support Desk Queues</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Manage escalation queries submitted when self-serve wasn’t sufficient.
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User & Contact</th>
                    <th>Query Category</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.user_name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t.user_phone} • {t.user_email}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                          Ticket #{t.id}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: t.query_type === 'whatsapp_link' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: t.query_type === 'whatsapp_link' ? '#4ade80' : '#a5b4fc',
                          }}
                        >
                          {t.query_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ maxWidth: '350px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                          {t.message}
                        </p>
                        {t.resolution_notes && (
                          <div style={{ fontSize: '0.78rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.08)', padding: '0.3rem 0.5rem', borderRadius: 4 }}>
                            <strong>Resolution:</strong> {t.resolution_notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background:
                              t.status === 'resolved'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : t.status === 'in_progress'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(244, 63, 94, 0.15)',
                            color:
                              t.status === 'resolved'
                                ? '#34d399'
                                : t.status === 'in_progress'
                                ? '#fbbf24'
                                : '#fb7185',
                          }}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {resolvingTicketId === t.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                            <input
                              type="text"
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              placeholder="Resolution note (e.g. Sent link via SMS)..."
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                padding: '0.35rem 0.5rem',
                                color: '#fff',
                                fontSize: '0.8rem',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateTicket(t.id, 'resolved')}
                                className="btn-primary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Resolve
                              </button>
                              <button
                                type="button"
                                onClick={() => setResolvingTicketId(null)}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {t.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setResolvingTicketId(t.id);
                                  setResolutionNote('');
                                }}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                              >
                                <Check size={13} style={{ color: '#34d399' }} />
                                <span>Resolve</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Support Bot Configuration */}
        {activeTab === 'config' && (
          <div className="data-table-card">
            <div className="table-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Support Assistant Runtime Configuration</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configure lookback window, live session thresholds, escalation WhatsApp numbers, and assistant message copies without redeploying.
                </span>
              </div>
            </div>

            {configSuccessMsg && (
              <div
                style={{
                  margin: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid #22c55e',
                  color: '#4ade80',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Check size={16} />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    LOOKBACK_DAYS (Order Search Window)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Number of days into the past to check for user registrations (Default: 14 days).
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    LIVE_WINDOW_MINUTES (Live Now State)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={liveWindowMinutes}
                    onChange={(e) => setLiveWindowMinutes(Number(e.target.value))}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Minutes after workshop start time where status is marked &quot;Live now&quot; (Default: 30 mins).
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    CENTRAL_SUPPORT_WHATSAPP (Escalation Number)
                  </label>
                  <input
                    type="text"
                    required
                    value={centralSupportWhatsapp}
                    onChange={(e) => setCentralSupportWhatsapp(e.target.value)}
                    className="form-control"
                    placeholder="e.g. 918949451726"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    With country code, no + or spaces (Default: 918949451726).
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    SUPPORT_SLA_TEXT
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSlaText}
                    onChange={(e) => setSupportSlaText(e.target.value)}
                    className="form-control"
                    placeholder="e.g. 24–48 hours"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Expected turnaround text shown to attendees during escalation.
                  </small>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                Bot Message Prompts & Copy
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    Welcome Greeting
                  </label>
                  <input
                    type="text"
                    value={copyWelcomeGreeting}
                    onChange={(e) => setCopyWelcomeGreeting(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#e2e8f0' }}>
                    Welcome Prompt
                  </label>
                  <input
                    type="text"
                    value={copyWelcomePrompt}
                    onChange={(e) => setCopyWelcomePrompt(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Settings size={15} />
                  <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Edit Workshop Modal */}
      {editingWorkshop && (
        <div className="modal-overlay" onClick={() => setEditingWorkshop(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update Workshop Links</h3>
              <button type="button" onClick={() => setEditingWorkshop(null)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkshop}>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{editingWorkshop.title}</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  Creator: {editingWorkshop.creator?.name}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Community / Group Invite URL</label>
                <input
                  type="url"
                  required
                  value={editWhatsAppLink}
                  onChange={(e) => setEditWhatsAppLink(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Direct Zoom Meeting Link</label>
                <input
                  type="url"
                  required
                  value={editZoomLink}
                  onChange={(e) => setEditZoomLink(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Zoom Meeting Passcode</label>
                <input
                  type="text"
                  value={editZoomPasscode}
                  onChange={(e) => setEditZoomPasscode(e.target.value)}
                  placeholder="e.g. LABS2026"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setEditingWorkshop(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingWorkshop} className="btn-primary">
                  <span>{savingWorkshop ? 'Saving...' : 'Save & Publish Links'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
