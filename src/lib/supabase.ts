import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_CREATORS,
  INITIAL_WORKSHOPS,
  INITIAL_REGISTRATIONS,
  INITIAL_TICKETS,
} from './mockData';
import { Creator, Workshop, Registration, SupportTicket } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

// In-memory state store for instant testing & demo without requiring DB config upfront
let inMemoryWorkshops: Workshop[] = [...INITIAL_WORKSHOPS];
let inMemoryRegistrations: Registration[] = [...INITIAL_REGISTRATIONS];
let inMemoryTickets: SupportTicket[] = [...INITIAL_TICKETS];
let inMemoryCreators: Creator[] = [...INITIAL_CREATORS];

/**
 * Normalizes phone numbers by stripping country codes (+91, 91), spaces, dashes, and parens
 */
export function normalizePhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}

/**
 * Look up registrations by phone number or email address
 */
export async function lookupAttendee(query: string): Promise<Registration[]> {
  const trimmed = query.trim().toLowerCase();
  const normalizedPhone = normalizePhone(query);

  if (isSupabaseConfigured && supabase) {
    try {
      let supabaseQuery = supabase
        .from('registrations')
        .select(`
          *,
          workshop:workshops (
            *,
            creator:creators (*)
          )
        `);

      if (trimmed.includes('@')) {
        supabaseQuery = supabaseQuery.ilike('user_email', trimmed);
      } else {
        supabaseQuery = supabaseQuery.or(`user_phone.ilike.%${normalizedPhone}%,user_phone.ilike.%${trimmed}%`);
      }

      const { data, error } = await supabaseQuery;
      if (!error && data && data.length > 0) {
        return data as Registration[];
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to mock store:', err);
    }
  }

  // Fallback to local memory store
  return inMemoryRegistrations
    .filter((reg) => {
      const emailMatches = reg.user_email.toLowerCase() === trimmed;
      const regPhoneDigits = normalizePhone(reg.user_phone);
      const phoneMatches = normalizedPhone.length >= 7 && regPhoneDigits.includes(normalizedPhone);
      return emailMatches || phoneMatches;
    })
    .map((reg) => {
      const workshop = inMemoryWorkshops.find((w) => w.id === reg.workshop_id);
      const creator = workshop ? inMemoryCreators.find((c) => c.id === workshop.creator_id) : undefined;
      return {
        ...reg,
        workshop: workshop ? { ...workshop, creator } : undefined,
      };
    });
}

/**
 * Fetch all workshops
 */
export async function getAllWorkshops(): Promise<Workshop[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select(`*, creator:creators (*)`)
        .order('start_time', { ascending: true });

      if (!error && data) return data as Workshop[];
    } catch (e) {
      console.error(e);
    }
  }

  return inMemoryWorkshops.map((w) => ({
    ...w,
    creator: inMemoryCreators.find((c) => c.id === w.creator_id),
  }));
}

/**
 * Update workshop details (Zoom link, WhatsApp link, start time)
 */
export async function updateWorkshop(
  workshopId: string,
  updates: Partial<Workshop>
): Promise<Workshop | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .update(updates)
        .eq('id', workshopId)
        .select(`*, creator:creators (*)`)
        .single();

      if (!error && data) return data as Workshop;
    } catch (e) {
      console.error(e);
    }
  }

  const index = inMemoryWorkshops.findIndex((w) => w.id === workshopId);
  if (index !== -1) {
    inMemoryWorkshops[index] = { ...inMemoryWorkshops[index], ...updates };
    return inMemoryWorkshops[index];
  }
  return null;
}

/**
 * Create a new support ticket
 */
export async function createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status' | 'priority'>): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    ...ticket,
    id: `tkt-${Date.now().toString(36)}`,
    status: 'open',
    priority: 'medium',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([newTicket])
        .select()
        .single();

      if (!error && data) return data as SupportTicket;
    } catch (e) {
      console.error(e);
    }
  }

  inMemoryTickets.unshift(newTicket);
  return newTicket;
}

/**
 * Fetch all tickets for admin
 */
export async function getAllTickets(): Promise<SupportTicket[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as SupportTicket[];
    } catch (e) {
      console.error(e);
    }
  }

  return inMemoryTickets;
}

/**
 * Update ticket status and resolution notes
 */
export async function updateTicketStatus(
  id: string,
  status: SupportTicket['status'],
  resolutionNotes?: string
): Promise<SupportTicket | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status, resolution_notes: resolutionNotes })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data as SupportTicket;
    } catch (e) {
      console.error(e);
    }
  }

  const idx = inMemoryTickets.findIndex((t) => t.id === id);
  if (idx !== -1) {
    inMemoryTickets[idx] = {
      ...inMemoryTickets[idx],
      status,
      resolution_notes: resolutionNotes ?? inMemoryTickets[idx].resolution_notes,
    };
    return inMemoryTickets[idx];
  }
  return null;
}

/**
 * Fetch all registrations for admin
 */
export async function getAllRegistrations(): Promise<Registration[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`*, workshop:workshops (*, creator:creators (*))`)
        .order('created_at', { ascending: false });

      if (!error && data) return data as Registration[];
    } catch (e) {
      console.error(e);
    }
  }

  return inMemoryRegistrations.map((reg) => ({
    ...reg,
    workshop: inMemoryWorkshops.find((w) => w.id === reg.workshop_id),
  }));
}
