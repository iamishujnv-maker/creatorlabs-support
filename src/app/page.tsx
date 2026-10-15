'use client';

import React, { useState } from 'react';
import { SupportFlowResult } from '@/lib/mongodb';

type Screen = '1A' | '1B' | '2A' | '2B' | '2C';
type Language = 'en' | 'hi';

export default function CreatorLabsSupportApp() {
  const [lang, setLang] = useState<Language>('en');
  const [screen, setScreen] = useState<Screen>('1A');

  // Input states
  const [useEmail, setUseEmail] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data & Copy states
  const [flowData, setFlowData] = useState<SupportFlowResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Bilingual strings matching wireframes
  const t = {
    en: {
      brand: 'Creator Labs',
      signInTitle: 'Get help with your registration',
      signInSubPhone: 'Enter the mobile number you registered with.',
      signInSubEmail: 'Enter the email you registered with.',
      mobileLabel: 'Mobile number',
      emailLabel: 'Email address',
      helperNote: '10 digits. Numeric keypad opens automatically.',
      continueBtn: 'Continue',
      loadingBtn: 'Finding registration...',
      useEmail: 'Use email instead',
      usePhone: 'Use mobile number instead',
      youAreRegistered: "You're registered",
      change: 'Change',
      whatDoYouNeed: 'What do you need?',
      optZoom: 'Zoom link for workshop',
      optWA: 'WhatsApp community link',
      optPaid: 'I paid but got no details',
      back: 'Back',
      zoomSub: 'Live webinar access',
      joinZoomBtn: 'Join Zoom meeting',
      copyLinkBtn: 'Copy link',
      copiedBtn: 'Link copied!',
      zoomPendingNotice: 'You will receive the Zoom link via WhatsApp one day before the webinar.',
      waTitle: 'WhatsApp community',
      waSub: 'updates and materials',
      joinWABtn: 'Join on WhatsApp',
      waPendingNotice: 'The WhatsApp community link is currently being refreshed by the creator team. Please check back shortly.',
      courseAccessTitle: 'Course access help',
      courseAccessSub: 'Contact the creator team and they will fix your access.',
      callBtn: 'Call',
      emailTeamBtn: 'Email team',
      footerBadge: 'Official Creator Labs helpdesk',
    },
    hi: {
      brand: 'Creator Labs',
      signInTitle: 'रजिस्ट्रेशन में मदद पाएं',
      signInSubPhone: 'वह मोबाइल नंबर दर्ज करें जिससे आपने रजिस्टर किया था।',
      signInSubEmail: 'वह ईमेल दर्ज करें जिससे आपने रजिस्टर किया था।',
      mobileLabel: 'मोबाइल नंबर',
      emailLabel: 'ईमेल आईडी',
      helperNote: '10 अंकों का नंबर। न्यूमेरिक कीपैड खुलेगा।',
      continueBtn: 'आगे बढ़ें',
      loadingBtn: 'विवरण खोज रहे हैं...',
      useEmail: 'ईमेल का उपयोग करें',
      usePhone: 'मोबाइल नंबर का उपयोग करें',
      youAreRegistered: 'आपका रजिस्ट्रेशन हो चुका है',
      change: 'बदलें',
      whatDoYouNeed: 'आपको क्या चाहिए?',
      optZoom: 'वर्कशॉप का ज़ूम लिंक',
      optWA: 'व्हाट्सएप कम्युनिटी लिंक',
      optPaid: 'पैसे कट गए लेकिन डिटेल्स नहीं मिलीं',
      back: 'वापस',
      zoomSub: 'लाइव वेबिनार एक्सेस',
      joinZoomBtn: 'ज़ूम मीटिंग से जुड़ें',
      copyLinkBtn: 'लिंक कॉपी करें',
      copiedBtn: 'लिंक कॉपी हो गया!',
      zoomPendingNotice: 'वेबिनार से एक दिन पहले आपको व्हाट्सएप पर ज़ूम लिंक प्राप्त होगा।',
      waTitle: 'व्हाट्सएप कम्युनिटी',
      waSub: 'अपडेट्स और स्टडी मटेरियल',
      joinWABtn: 'व्हाट्सएप ग्रुप से जुड़ें',
      waPendingNotice: 'व्हाट्सएप कम्युनिटी लिंक अपडेट किया जा रहा है। कृपया थोड़ी देर बाद देखें।',
      courseAccessTitle: 'कोर्स एक्सेस सहायता',
      courseAccessSub: 'क्रिएटर टीम से संपर्क करें और वे आपकी समस्या हल कर देंगे।',
      callBtn: 'कॉल करें',
      emailTeamBtn: 'ईमेल भेजें',
      footerBadge: 'ऑफिशियल क्रिएटर लैब्स हेल्पडेस्क',
    },
  }[lang];

  // Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let queryValue = '';

    if (!useEmail) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length !== 10) {
        setErrorMsg(
          lang === 'hi'
            ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
            : 'Please enter a valid 10-digit mobile number.'
        );
        return;
      }
      queryValue = cleanDigits;
    } else {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMsg(
          lang === 'hi'
            ? 'कृपया मान्य ईमेल दर्ज करें।'
            : 'Please enter a valid email address.'
        );
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
        setScreen('1B');
      } else {
        setErrorMsg(
          data.error ||
            (lang === 'hi'
              ? 'पिछले 7 दिनों में कोई पेड रजिस्ट्रेशन नहीं मिला।'
              : 'No paid registration found in the last 7 days.')
        );
      }
    } catch {
      setErrorMsg(
        lang === 'hi'
          ? 'नेटवर्क समस्या। कृपया पुनः प्रयास करें।'
          : 'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetTo1A = () => {
    setScreen('1A');
    setErrorMsg(null);
  };

  // Masking phone number like wireframe: +91 98••••••210
  const maskPhone = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '').slice(-10);
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 2)}••••••${digits.slice(-3)}`;
    }
    return rawPhone;
  };

  const maskEmail = (rawEmail: string) => {
    const parts = rawEmail.split('@');
    if (parts.length === 2 && parts[0].length > 2) {
      return `${parts[0].slice(0, 2)}••••@${parts[1]}`;
    }
    return rawEmail;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
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
      <div className="wireframe-container">
        <div>
          {/* Header Bar: Language Switcher [EN | हिंदी] (no domain/brand at top) */}
          {screen === '1A' || screen === '1B' ? (
            <div className="top-header-row">
              <div className="lang-switcher">
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => setLang('hi')}
                >
                  हिंदी
                </button>
              </div>
            </div>
          ) : (
            /* Back button header for screens 2A, 2B, 2C */
            <div className="back-header-row">
              <button
                type="button"
                onClick={() => setScreen('1B')}
                className="btn-back-nav"
              >
                <span>&larr;</span>
                <span>{t.back}</span>
              </button>
              <div className="lang-switcher">
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => setLang('hi')}
                >
                  हिंदी
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 1A: SIGN IN
              ======================================================== */}
          {screen === '1A' && (
            <div>
              <h1 className="signin-title">{t.signInTitle}</h1>
              <p className="signin-subtitle">
                {useEmail ? t.signInSubEmail : t.signInSubPhone}
              </p>

              {errorMsg && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSearch}>
                {!useEmail ? (
                  <div>
                    <label className="form-label">{t.mobileLabel}</label>
                    <div className="input-group-phone">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="input-phone-native"
                        autoFocus
                      />
                    </div>
                    <p className="input-helper-note">{t.helperNote}</p>
                  </div>
                ) : (
                  <div>
                    <label className="form-label">{t.emailLabel}</label>
                    <input
                      type="email"
                      inputMode="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input-email-native"
                      autoFocus
                    />
                    <p className="input-helper-note">
                      {lang === 'hi' ? 'अपना रजिस्टर्ड ईमेल दर्ज करें।' : 'Enter your registered email address.'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-continue-blue"
                >
                  {loading ? t.loadingBtn : t.continueBtn}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUseEmail(!useEmail);
                    setErrorMsg(null);
                  }}
                  className="btn-toggle-mode"
                >
                  {useEmail ? t.usePhone : t.useEmail}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================
              SCREEN 1B: HELP OPTIONS
              ======================================================== */}
          {screen === '1B' && order && (
            <div>
              {/* Registration Details (Pointer List) */}
              <div className="registration-details-block">
                <div className="registration-heading-row">
                  <span className="inline-check-icon">✓</span>
                  <span className="registration-heading-text">
                    {lang === 'hi'
                      ? 'आपका रजिस्ट्रेशन सफल हो चुका है'
                      : 'Your registration is confirmed'}
                  </span>
                </div>

                <ul className="details-list">
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'नाम' : 'Name'}</span>
                    <span className="detail-value">{order.customerName}</span>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'क्रिएटर' : 'Creator'}</span>
                    <span className="detail-value">{order.creatorName}</span>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'रजिस्ट्रेशन पेज' : 'Registration page'}</span>
                    <a
                      href={`https://${order.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-value detail-link"
                    >
                      {order.domain}
                    </a>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'भुगतान राशि' : 'Amount paid'}</span>
                    <span className="detail-value">
                      {order.currency === 'INR' ? '₹' : order.currency}{order.amountPaid}
                    </span>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'रजिस्ट्रेशन तिथि' : 'Date'}</span>
                    <span className="detail-value">{formatDate(order.registrationDate)}</span>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'फोन' : 'Phone'}</span>
                    <span className="detail-value">{order.customerPhone || '—'}</span>
                  </li>
                  <li>
                    <span className="detail-label">{lang === 'hi' ? 'ईमेल' : 'Email'}</span>
                    <span className="detail-value">{order.customerEmail || '—'}</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={handleResetTo1A}
                  className="change-link"
                  style={{ marginTop: '8px' }}
                >
                  {lang === 'hi' ? 'दूसरा नंबर/ईमेल आज़माएं' : 'Not you? Search again'}
                </button>
              </div>

              {/* Heading: What do you need? */}
              <h2 className="section-heading-lg">{t.whatDoYouNeed}</h2>

              {/* 3 Help Option Cards */}
              <div className="help-options-stack">
                <button
                  type="button"
                  onClick={() => {
                    setCopied(false);
                    setScreen('2A');
                  }}
                  className="help-option-card"
                >
                  <div className="option-left-content">
                    <span className="option-icon">📹</span>
                    <span className="option-text">{t.optZoom}</span>
                  </div>
                  <span className="chevron-arrow">&rsaquo;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCopied(false);
                    setScreen('2B');
                  }}
                  className="help-option-card"
                >
                  <div className="option-left-content">
                    <span className="option-icon" style={{ color: '#16a34a' }}>👥</span>
                    <span className="option-text">{t.optWA}</span>
                  </div>
                  <span className="chevron-arrow">&rsaquo;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('2C')}
                  className="help-option-card"
                >
                  <div className="option-left-content">
                    <span className="option-icon" style={{ color: '#2563eb' }}>🧾</span>
                    <span className="option-text">{t.optPaid}</span>
                  </div>
                  <span className="chevron-arrow">&rsaquo;</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 2A: ZOOM LINK
              ======================================================== */}
          {screen === '2A' && order && (
            <div>
              <h2 className="detail-view-title">{t.optZoom}</h2>
              <p className="detail-view-subtitle">{order.creatorName}</p>

              {flowData?.zoomLink ? (
                <div>
                  <div className="link-display-pill">
                    <span className="link-icon-wrap">📹</span>
                    <span>{flowData.zoomLink.replace(/^https?:\/\//, '')}</span>
                  </div>

                  <a
                    href={flowData.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action-primary-blue"
                  >
                    <span>📹</span>
                    <span>{t.joinZoomBtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => copyLink(flowData.zoomLink!)}
                    className="btn-action-outline"
                  >
                    <span>📋</span>
                    <span>{copied ? t.copiedBtn : t.copyLinkBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="notice-box-clean">
                  {t.zoomPendingNotice}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SCREEN 2B: WHATSAPP COMMUNITY
              ======================================================== */}
          {screen === '2B' && order && (
            <div>
              <h2 className="detail-view-title">{t.waTitle}</h2>
              <p className="detail-view-subtitle">
                {order.creatorName} • {t.waSub}
              </p>

              {flowData?.whatsappCommunityLink ? (
                <div>
                  <div className="link-display-pill">
                    <span className="link-icon-wrap" style={{ color: '#16a34a' }}>👥</span>
                    <span>{flowData.whatsappCommunityLink.replace(/^https?:\/\//, '')}</span>
                  </div>

                  <a
                    href={flowData.whatsappCommunityLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action-primary-green"
                  >
                    <span>👥</span>
                    <span>{t.joinWABtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => copyLink(flowData.whatsappCommunityLink!)}
                    className="btn-action-outline"
                  >
                    <span>📋</span>
                    <span>{copied ? t.copiedBtn : t.copyLinkBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="notice-box-clean">
                  {t.waPendingNotice}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SCREEN 2C: PAID, NO DETAILS (COURSE ACCESS HELP)
              ======================================================== */}
          {screen === '2C' && order && (
            <div>
              <h2 className="detail-view-title">{t.courseAccessTitle}</h2>
              <p className="detail-view-subtitle">
                {order.creatorName}. {t.courseAccessSub}
              </p>

              <div>
                <a
                  href={`tel:${flowData?.creatorSupportPhone.replace(/[^\d+]/g, '')}`}
                  className="btn-action-primary-blue"
                >
                  <span>📞</span>
                  <span>
                    {t.callBtn} {flowData?.creatorSupportPhone}
                  </span>
                </a>

                <a
                  href={`mailto:${flowData?.creatorSupportEmail}`}
                  className="btn-action-outline"
                >
                  <span>✉️</span>
                  <span>{t.emailTeamBtn}</span>
                </a>

                <p className="caption-email-sub">{flowData?.creatorSupportEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Security / Trust Footer */}
        <footer className="wireframe-footer">
          <span>🛡️</span>
          <span>{t.footerBadge}</span>
        </footer>
      </div>
    </div>
  );
}
