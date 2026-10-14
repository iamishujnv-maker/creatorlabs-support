import { NextRequest, NextResponse } from 'next/server';
import { getSupportOrderFlow } from '@/lib/mongodb';

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

    const flowData = await getSupportOrderFlow(query);

    if (!flowData) {
      return NextResponse.json(
        {
          success: false,
          error: 'No paid registration found in the last 7 days for this phone number or email. Please check your details or contact support.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flowData,
    });
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      { error: 'Server error while checking your registration details.' },
      { status: 500 }
    );
  }
}
