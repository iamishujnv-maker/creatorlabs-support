import { NextRequest, NextResponse } from 'next/server';
import { getLatestPaidOrder } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number or email address.' },
        { status: 400 }
      );
    }

    const order = await getLatestPaidOrder(query);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'No paid registration found with this phone number or email. Please check and try again.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      { error: 'Server error while checking your registration details.' },
      { status: 500 }
    );
  }
}
