import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context missing from authentication token');
    }

    // 1. JWT Tenant Claim is the source of truth
    request.tenantId = user.tenantId;

    // Optional: Cross-check with a header if we allow Gateway overrides (for trusted internal calls only)
    // const headerTenantId = request.headers['x-tenant-id'];
    // if (headerTenantId && headerTenantId !== user.tenantId) {
    //   throw new ForbiddenException('Tenant mismatch between token and header');
    // }

    return true;
  }
}
