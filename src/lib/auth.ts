import { NextRequest } from 'next/server';

const DEFAULT_ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'creatorlabs_support_secure_2026';

export function isAuthorizedAdmin(request: NextRequest): boolean {
  const adminKey =
    request.headers.get('x-admin-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.nextUrl.searchParams.get('admin_key');

  if (!adminKey) {
    return false;
  }

  // Constant-time string comparison to prevent timing attacks
  if (adminKey.length !== DEFAULT_ADMIN_KEY.length) {
    return false;
  }

  let match = true;
  for (let i = 0; i < adminKey.length; i++) {
    if (adminKey[i] !== DEFAULT_ADMIN_KEY[i]) {
      match = false;
    }
  }

  return match;
}
