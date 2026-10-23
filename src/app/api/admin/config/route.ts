import { NextRequest, NextResponse } from 'next/server';
import { getSupportConfig, updateSupportConfig } from '@/lib/supportConfig';

export async function GET() {
  try {
    const config = getSupportConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching support config:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updateSupportConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating support config:', error);
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
