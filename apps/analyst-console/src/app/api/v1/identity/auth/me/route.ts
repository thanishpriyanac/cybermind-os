import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const tenantHeader = request.headers.get('x-tenant-id');
  return NextResponse.json({
    userId: 'admin-user-id',
    tenantId: tenantHeader || 'cybermind-master-tenant',
    email: 'admin@cybermind.local',
    status: 'ACTIVE',
  });
}
