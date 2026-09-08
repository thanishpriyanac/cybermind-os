import { NextResponse } from 'next/server';
import { getVendorControls } from '@/lib/vendors';
import { Vendor } from '@/lib/firewall-store';

export async function GET(request: Request, { params }: { params: { vendor: string } }) {
  try {
    const controls = getVendorControls(params.vendor as Vendor);
    return NextResponse.json(controls);
  } catch (error) {
    console.error('Failed to get vendor controls:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
