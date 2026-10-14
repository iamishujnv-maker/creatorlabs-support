import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registration_id, email, phone, workshop_title } = body;

    if (!registration_id || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Missing registration details for notification dispatch' },
        { status: 400 }
      );
    }

    // In production, integrate with Twilio/Gupshup (WhatsApp/SMS) and Resend/SendGrid (Email)
    // Here we simulate successful dispatch and return a timestamp
    return NextResponse.json({
      success: true,
      message: `Workshop access details resent successfully to ${email || phone}!`,
      dispatched_at: new Date().toISOString(),
      channels: ['WhatsApp', 'SMS', 'Email'],
    });
  } catch (error) {
    console.error('Error resending details:', error);
    return NextResponse.json(
      { error: 'Failed to resend workshop details' },
      { status: 500 }
    );
  }
}
