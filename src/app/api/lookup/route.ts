import { NextRequest, NextResponse } from 'next/server';
import { lookupSupportAttendee } from '@/lib/supportService';

// Simple in-memory sliding window rate limiter
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recent.push(now);
  ipRequests.set(ip, recent);

  // Periodically clean up old IPs
  if (ipRequests.size > 1000) {
    for (const [k, v] of ipRequests.entries()) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequests.delete(k);
      }
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a moment before trying again.',
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('query');

    if (!rawQuery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid phone number or email address.',
        },
        { status: 400 }
      );
    }

    const query = rawQuery.replace(/\s+/g, '');
    const isEmail = query.includes('@');

    if (isEmail) {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(query)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please enter a valid email address with domain (e.g. name@gmail.com).',
          },
          { status: 400 }
        );
      }
    } else {
      const digitsOnly = query.replace(/\D/g, '');
      const core10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      if (core10.length !== 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please enter a valid 10-digit mobile number.',
          },
          { status: 400 }
        );
      }
    }

    const result = await lookupSupportAttendee(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while checking your registration details.',
      },
      { status: 500 }
    );
  }
}
