import { NextResponse } from 'next/server';
import { ipStore } from '../../../../../lib/ip-store';

export async function GET() {
  try {
    const history = ipStore.getHistory(50);
    return NextResponse.json(history);
  } catch (err: any) {
    console.error('IP History Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
