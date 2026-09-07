import { NextResponse } from 'next/server';
import { copilotStore } from '@/lib/copilot-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conv = copilotStore.getConversation(id);
    if (!conv) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }
    return NextResponse.json(conv);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    copilotStore.deleteConversation(id);
    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
