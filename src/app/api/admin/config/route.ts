import { NextRequest, NextResponse } from 'next/server';
import { getSupportConfig, updateSupportConfig } from '@/lib/supportConfig';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials are required.' },
      { status: 401 }
    );
  }

  try {
    const config = getSupportConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching support config:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
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
    const updated = updateSupportConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating support config:', error);
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
