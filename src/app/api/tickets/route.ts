import { NextRequest, NextResponse } from 'next/server';
import { createTicket } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_name, user_email, user_phone, workshop_id, query_type, message } = body;

    if (!user_name || !user_email || !user_phone || !message) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and query message are required' },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      user_name,
      user_email,
      user_phone,
      workshop_id: workshop_id || undefined,
      query_type: query_type || 'other',
      message,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Support ticket submitted successfully. Our team will get back to you shortly.',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
