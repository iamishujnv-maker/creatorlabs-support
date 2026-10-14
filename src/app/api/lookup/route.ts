import { NextRequest, NextResponse } from 'next/server';
import { lookupAttendee } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number or email address' },
        { status: 400 }
      );
    }

    const registrations = await lookupAttendee(query);

    return NextResponse.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Error looking up attendee:', error);
    return NextResponse.json(
      { error: 'An error occurred while looking up your registration details' },
      { status: 500 }
    );
  }
}
