export interface Creator {
  id: string;
  name: string;
  brand_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  bio?: string;
  support_hours?: string;
}

export interface Workshop {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  banner_image?: string;
  start_time: string; // ISO string
  duration_minutes: number;
  whatsapp_link: string;
  zoom_link: string;
  zoom_passcode?: string;
  zoom_meeting_id?: string;
  zoom_available_hours_before: number; // e.g. 24 hours before
  status: 'upcoming' | 'live' | 'completed';
  creator?: Creator;
}

export interface Registration {
  id: string;
  workshop_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  amount_paid: number;
  currency: string;
  payment_id: string;
  payment_status: 'paid' | 'pending' | 'refunded';
  created_at: string;
  workshop?: Workshop;
}

export interface SupportTicket {
  id: string;
  user_email: string;
  user_phone: string;
  user_name: string;
  workshop_id?: string;
  query_type: 'whatsapp_link' | 'zoom_link' | 'payment_issue' | 'reschedule' | 'other';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  resolution_notes?: string;
}
