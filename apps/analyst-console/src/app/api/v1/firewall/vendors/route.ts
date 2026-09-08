import { NextResponse } from 'next/server';
import { vendorList } from '@/lib/vendors';

export async function GET() {
  try {
    return NextResponse.json(vendorList);
  } catch (error) {
    console.error('Failed to get vendors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
