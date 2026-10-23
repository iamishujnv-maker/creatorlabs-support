import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRegistrations,
  getAllWorkshops,
  getAllTickets,
  updateWorkshop,
  updateTicketStatus,
} from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials are required.' },
      { status: 401 }
    );
  }

  try {
    const [registrations, workshops, tickets] = await Promise.all([
      getAllRegistrations(),
      getAllWorkshops(),
      getAllTickets(),
    ]);

    const totalRevenue = registrations.reduce((acc, r) => acc + (Number(r.amount_paid) || 0), 0);
    const openTicketsCount = tickets.filter((t) => t.status === 'open').length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistrations: registrations.length,
        totalWorkshops: workshops.length,
        totalRevenue,
        openTickets: openTicketsCount,
      },
      registrations,
      workshops,
      tickets,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials are required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, id, updates, status, resolutionNotes } = body;

    if (action === 'update_workshop') {
      const updated = await updateWorkshop(id, updates);
      return NextResponse.json({ success: true, workshop: updated });
    }

    if (action === 'update_ticket') {
      const updated = await updateTicketStatus(id, status, resolutionNotes);
      return NextResponse.json({ success: true, ticket: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update admin data' },
      { status: 500 }
    );
  }
}
