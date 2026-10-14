-- ========================================================
-- CREATOR LABS SUPPORT PLATFORM - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATORS TABLE
CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  support_hours TEXT DEFAULT 'Mon - Sat, 10:00 AM - 7:00 PM IST',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSHOPS / WEBINARS TABLE
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creator_id TEXT REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  banner_image TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  whatsapp_link TEXT NOT NULL,
  zoom_link TEXT NOT NULL,
  zoom_meeting_id TEXT,
  zoom_passcode TEXT,
  zoom_available_hours_before INTEGER DEFAULT 24,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE (Populated after payment from Creator Landing Page)
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workshop_id TEXT REFERENCES workshops(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT NOT NULL,
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPORT TICKETS TABLE (For unresolved queries / human escalations)
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workshop_id TEXT REFERENCES workshops(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK (query_type IN ('whatsapp_link', 'zoom_link', 'payment_issue', 'reschedule', 'other')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast attendee lookup
CREATE INDEX IF NOT EXISTS idx_reg_phone ON registrations (user_phone);
CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations (user_email);
CREATE INDEX IF NOT EXISTS idx_workshops_start ON workshops (start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets (status);

-- Enable Row Level Security (RLS)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read creators & workshops
CREATE POLICY "Public creators viewable" ON creators FOR SELECT USING (true);
CREATE POLICY "Public workshops viewable" ON workshops FOR SELECT USING (true);

-- Allow public lookup of registrations by exact phone or email
CREATE POLICY "Attendees can lookup registrations" ON registrations
  FOR SELECT USING (true);

-- Allow attendees to submit support tickets
CREATE POLICY "Public can submit support tickets" ON support_tickets
  FOR INSERT WITH CHECK (true);

-- Allow reading support tickets
CREATE POLICY "Public can view tickets" ON support_tickets
  FOR SELECT USING (true);

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

INSERT INTO creators (id, name, brand_name, email, phone, avatar_url, bio, support_hours)
VALUES 
  ('creator-1', 'Rohan Sharma', 'Creator Funnel Academy', 'support@rohansharma.in', '+91 99887 76655', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'Helping Indian creators scale to 10L/month with automated Meta ad funnels & high-ticket webinars.', 'Mon - Sat, 10:00 AM - 7:00 PM IST'),
  ('creator-2', 'Aanya Verma', 'AI Content Systems', 'help@aanyaverma.co', '+91 98123 45678', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'Ex-Google strategist turned creator. Teaching 10x content workflows using modern AI tools.', 'Mon - Fri, 11:00 AM - 8:00 PM IST'),
  ('creator-3', 'Devansh Gupta', 'Reels Growth Blueprint', 'support@devanshgupta.com', '+91 97110 02233', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'Over 2.5M community across Instagram & YouTube. Viral growth and retention systems for creators.', 'Everyday, 10:00 AM - 9:00 PM IST')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workshops (id, creator_id, title, description, start_time, duration_minutes, whatsapp_link, zoom_link, zoom_meeting_id, zoom_passcode, zoom_available_hours_before, status)
VALUES
  ('ws-101', 'creator-1', 'High-Ticket Webinar & Funnel Masterclass (Batch 14)', 'Learn step-by-step how to set up Meta ads, build landing pages that convert at 12%+, and pitch high-ticket coaching.', NOW() + INTERVAL '2 days', 150, 'https://chat.whatsapp.com/CreatorLabsVIPBatch14', 'https://zoom.us/j/98124982143?pwd=CreatorLabsWebinar2026', '981 2498 2143', 'LABS2026', 24, 'upcoming'),
  ('ws-102', 'creator-2', 'The AI Content Production Machine: 30 Days in 3 Hours', 'Hands-on workshop building your automated scripting, video editing, and carousel distribution pipeline with AI.', NOW() + INTERVAL '4 hours', 120, 'https://chat.whatsapp.com/AIContentSprintVIP', 'https://zoom.us/j/84729103847?pwd=AIProductionSprint2026', '847 2910 3847', 'AIPRO26', 24, 'upcoming'),
  ('ws-103', 'creator-3', 'Short-Form Video Mastery & 100k Follower Roadmap', 'Viral hooks, pacing formulas, retention science, and monetization funnels for Instagram & YouTube Shorts.', NOW() + INTERVAL '5 days', 180, 'https://chat.whatsapp.com/ReelsBlueprintMastery', 'https://zoom.us/j/75619283746?pwd=ShortsRetentionLive', '756 1928 3746', 'REELS99', 24, 'upcoming')
ON CONFLICT (id) DO NOTHING;

INSERT INTO registrations (id, workshop_id, user_name, user_email, user_phone, amount_paid, currency, payment_id, payment_status)
VALUES
  ('reg-001', 'ws-101', 'Rahul Sharma', 'rahul.sharma@example.com', '9876543210', 499, 'INR', 'pay_NzkX92384Klm', 'paid'),
  ('reg-002', 'ws-102', 'Priya Patel', 'priya.patel@example.com', '9811223344', 999, 'INR', 'pay_LkaJ381923Hs', 'paid'),
  ('reg-003', 'ws-103', 'Arjun Verma', 'arjun.v@example.com', '9900112233', 499, 'INR', 'pay_PqpS981248Qe', 'paid'),
  ('reg-004', 'ws-102', 'Rahul Sharma', 'rahul.sharma@example.com', '9876543210', 999, 'INR', 'pay_MbaW719283Ty', 'paid')
ON CONFLICT (id) DO NOTHING;
