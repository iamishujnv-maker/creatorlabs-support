import { Creator, Workshop, Registration, SupportTicket } from '@/types';

export const INITIAL_CREATORS: Creator[] = [
  {
    id: 'creator-1',
    name: 'Rohan Sharma',
    brand_name: 'Creator Funnel Academy',
    email: 'support@rohansharma.in',
    phone: '+91 99887 76655',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Helping Indian creators scale to 10L/month with automated Meta ad funnels & high-ticket webinars.',
    support_hours: 'Mon - Sat, 10:00 AM - 7:00 PM IST',
  },
  {
    id: 'creator-2',
    name: 'Aanya Verma',
    brand_name: 'AI Content Systems',
    email: 'help@aanyaverma.co',
    phone: '+91 98123 45678',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    bio: 'Ex-Google strategist turned creator. Teaching 10x content workflows using modern AI tools.',
    support_hours: 'Mon - Fri, 11:00 AM - 8:00 PM IST',
  },
  {
    id: 'creator-3',
    name: 'Devansh Gupta',
    brand_name: 'Reels Growth Blueprint',
    email: 'support@devanshgupta.com',
    phone: '+91 97110 02233',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Over 2.5M community across Instagram & YouTube. Viral growth and retention systems for creators.',
    support_hours: 'Everyday, 10:00 AM - 9:00 PM IST',
  },
];

// Today + 2 days for an upcoming workshop (Zoom locked until 24h before)
const upcomingDate1 = new Date();
upcomingDate1.setDate(upcomingDate1.getDate() + 2);
upcomingDate1.setHours(19, 0, 0, 0);

// Today + 4 hours for an impending workshop (Zoom unlocked!)
const imminentDate = new Date();
imminentDate.setHours(imminentDate.getHours() + 4);

export const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: 'ws-101',
    creator_id: 'creator-1',
    title: 'High-Ticket Webinar & Funnel Masterclass (Batch 14)',
    description: 'Learn step-by-step how to set up Meta ads, build landing pages that convert at 12%+, and pitch high-ticket coaching.',
    start_time: upcomingDate1.toISOString(),
    duration_minutes: 150,
    whatsapp_link: 'https://chat.whatsapp.com/CreatorLabsVIPBatch14',
    zoom_link: 'https://zoom.us/j/98124982143?pwd=CreatorLabsWebinar2026',
    zoom_meeting_id: '981 2498 2143',
    zoom_passcode: 'LABS2026',
    zoom_available_hours_before: 24,
    status: 'upcoming',
    creator: INITIAL_CREATORS[0],
  },
  {
    id: 'ws-102',
    creator_id: 'creator-2',
    title: 'The AI Content Production Machine: 30 Days in 3 Hours',
    description: 'Hands-on workshop building your automated scripting, video editing, and carousel distribution pipeline with AI.',
    start_time: imminentDate.toISOString(),
    duration_minutes: 120,
    whatsapp_link: 'https://chat.whatsapp.com/AIContentSprintVIP',
    zoom_link: 'https://zoom.us/j/84729103847?pwd=AIProductionSprint2026',
    zoom_meeting_id: '847 2910 3847',
    zoom_passcode: 'AIPRO26',
    zoom_available_hours_before: 24,
    status: 'upcoming',
    creator: INITIAL_CREATORS[1],
  },
  {
    id: 'ws-103',
    creator_id: 'creator-3',
    title: 'Short-Form Video Mastery & 100k Follower Roadmap',
    description: 'Viral hooks, pacing formulas, retention science, and monetization funnels for Instagram & YouTube Shorts.',
    start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 180,
    whatsapp_link: 'https://chat.whatsapp.com/ReelsBlueprintMastery',
    zoom_link: 'https://zoom.us/j/75619283746?pwd=ShortsRetentionLive',
    zoom_meeting_id: '756 1928 3746',
    zoom_passcode: 'REELS99',
    zoom_available_hours_before: 24,
    status: 'upcoming',
    creator: INITIAL_CREATORS[2],
  },
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-001',
    workshop_id: 'ws-101',
    user_name: 'Rahul Sharma',
    user_email: 'rahul.sharma@example.com',
    user_phone: '9876543210',
    amount_paid: 499,
    currency: 'INR',
    payment_id: 'pay_NzkX92384Klm',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'reg-002',
    workshop_id: 'ws-102',
    user_name: 'Priya Patel',
    user_email: 'priya.patel@example.com',
    user_phone: '9811223344',
    amount_paid: 999,
    currency: 'INR',
    payment_id: 'pay_LkaJ381923Hs',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'reg-003',
    workshop_id: 'ws-103',
    user_name: 'Arjun Verma',
    user_email: 'arjun.v@example.com',
    user_phone: '9900112233',
    amount_paid: 499,
    currency: 'INR',
    payment_id: 'pay_PqpS981248Qe',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'reg-004',
    workshop_id: 'ws-102',
    user_name: 'Rahul Sharma',
    user_email: 'rahul.sharma@example.com',
    user_phone: '9876543210',
    amount_paid: 999,
    currency: 'INR',
    payment_id: 'pay_MbaW719283Ty',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-101',
    user_name: 'Amit Deshmukh',
    user_email: 'amit.d@example.com',
    user_phone: '9822334455',
    workshop_id: 'ws-101',
    query_type: 'whatsapp_link',
    message: 'I made the payment for Rohan Sharma webinar but the WhatsApp link gave an invite revoked error. Please help.',
    status: 'in_progress',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resolution_notes: 'Sent direct community join link via SMS.',
  },
  {
    id: 'tkt-102',
    user_name: 'Sneha Kapoor',
    user_email: 'sneha.k@example.com',
    user_phone: '9733445566',
    workshop_id: 'ws-102',
    query_type: 'zoom_link',
    message: 'Can I get the Zoom passcode? The meeting link asks for a 6-digit code.',
    status: 'resolved',
    priority: 'medium',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolution_notes: 'Provided passcode AIPRO26. Ticket resolved.',
  },
];
