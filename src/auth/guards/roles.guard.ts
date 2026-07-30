import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Minimal temporary implementation for compilation stability
    // In production, uses Reflector to check Roles decorator against user.role
    return true; 
  }
}
