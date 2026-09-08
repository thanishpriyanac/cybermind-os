import { NextResponse } from 'next/server';
import { firewallStore } from '@/lib/firewall-store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const assessment = firewallStore.getAssessment(params.id);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Failed to get assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { findings, status } = body;
    
    const assessment = firewallStore.getAssessment(params.id);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const updates: any = {};
    if (findings) updates.findings = findings;
    if (status) updates.status = status;

    const updated = firewallStore.updateAssessment(params.id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    firewallStore.deleteAssessment(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
