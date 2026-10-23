import { NextRequest, NextResponse } from 'next/server';
import { lookupSupportAttendee } from '@/lib/supportService';

// Sliding window rate limiter (Defense-in-depth: max 5 lookups per IP per minute)
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

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
  if (ipRequests.size > 2000) {
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
    // 1. Anti-Scraping / Origin & Referer Verification
    const host = request.headers.get('host') || '';
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const secFetchSite = request.headers.get('sec-fetch-site');

    // Reject cross-site automated scraping requests
    if (secFetchSite === 'cross-site') {
      return NextResponse.json(
        { success: false, error: 'Cross-origin access is not permitted.' },
        { status: 403 }
      );
    }

    // In production, block direct script/cURL scraping without a valid Referer from our own app
    if (process.env.NODE_ENV === 'production') {
      const hostClean = host.split(':')[0].toLowerCase();
      const hasValidReferer = referer && (referer.toLowerCase().includes(hostClean) || referer.includes('creatorlabs'));
      const hasValidOrigin = origin && (origin.toLowerCase().includes(hostClean) || origin.includes('creatorlabs'));

      if (!hasValidReferer && !hasValidOrigin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Direct API access is restricted. Please use the Creator Labs support portal interface.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Client IP extraction & Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many lookup attempts. Please wait 1 minute before trying again.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // 3. Strict Input Validation & Sanitization
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('query');

    if (!rawQuery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid mobile number or email ID.',
        },
        { status: 400 }
      );
    }

    const query = rawQuery.replace(/\s+/g, '');
    const isEmail = query.includes('@');

    if (isEmail) {
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(query) || query.length > 100) {
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
      if (core10.length !== 10 || !/^[6-9]\d{9}$/.test(core10)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please enter a valid 10-digit Indian mobile number.',
          },
          { status: 400 }
        );
      }
    }

    // 4. Secure lookup
    const result = await lookupSupportAttendee(query);

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to check your registration details right now. Please try again in a few moments.',
      },
      { status: 500 }
    );
  }
}
