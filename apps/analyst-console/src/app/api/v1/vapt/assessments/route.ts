export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAssessments, createAssessment } from '@/lib/vapt-store';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const assessments = getAssessments(tenantId);

    return NextResponse.json({
      status: 'success',
      total: assessments.length,
      data: assessments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch VAPT assessments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const body = await req.json();

    if (!body.name || !body.target || !body.authorizationReference || !body.confirmedBy) {
      return NextResponse.json(
        { error: 'Missing required parameters: name, target, authorizationReference, and confirmedBy are mandatory.' },
        { status: 400 }
      );
    }

    const assessment = createAssessment({
      name: body.name,
      target: body.target,
      targetType: body.targetType || 'web_app',
      allowedPaths: Array.isArray(body.allowedPaths) ? body.allowedPaths : ['/*'],
      excludedPaths: Array.isArray(body.excludedPaths) ? body.excludedPaths : [],
      authorizationReference: body.authorizationReference,
      confirmedBy: body.confirmedBy,
      testProfile: body.testProfile || 'STANDARD_AUTHORIZED',
      tenantId,
    });

    return NextResponse.json({
      status: 'success',
      message: 'VAPT Assessment created and authorized successfully',
      data: assessment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create VAPT assessment' }, { status: 400 });
  }
}
