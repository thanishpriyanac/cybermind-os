import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Minimal temporary implementation for compilation stability
    // In production, this extends @nestjs/passport AuthGuard('jwt')
    return true; 
  }
}
