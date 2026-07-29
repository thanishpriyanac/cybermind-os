import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { IUserRepository } from '../repositories/user.repository';
import { ITenantRepository } from '../repositories/tenant.repository';
import { ISessionRepository } from '../repositories/session.repository';
import { IAuditRepository } from '../repositories/audit.repository';
import { IPasswordHasher } from './password-hasher/password-hasher.interface';
import { CybermindKafkaPublisher } from '@cybermind-os/event-client';

@Injectable()
export class AuthDomainService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository') private readonly tenantRepository: ITenantRepository,
    @Inject('ISessionRepository') private readonly sessionRepository: ISessionRepository,
    @Inject('IAuditRepository') private readonly auditRepository: IAuditRepository,
    @Inject('IPasswordHasher') private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
    private readonly eventPublisher: CybermindKafkaPublisher,
  ) {}

  async login(tenantSlug: string, email: string, passwordPlain: string, ipAddress: string, userAgent: string) {
    // 1. Tenant Validation
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid or inactive tenant.');
    }

    // 2. User Lookup
    const user = await this.userRepository.findByEmail(email, tenant.id);
    if (!user || !user.passwordHash) {
      await this.logFailedAttempt(tenant.id, email, ipAddress, userAgent, 'Invalid credentials');
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 3. Password Verification
    const isPasswordValid = await this.passwordHasher.verify(user.passwordHash, passwordPlain);
    if (!isPasswordValid) {
      await this.logFailedAttempt(tenant.id, email, ipAddress, userAgent, 'Invalid credentials');
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 4. Account Status Check
    if (user.status !== 'ACTIVE') {
      await this.logFailedAttempt(tenant.id, email, ipAddress, userAgent, 'Account inactive');
      throw new UnauthorizedException('Account is inactive.');
    }

    // 5. Session Creation
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = await this.sessionRepository.create({
      userId: user.id,
      tenantId: tenant.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 6. JWT Issuance
    const accessToken = this.jwtService.sign({
      sub: user.id,
      tid: tenant.id,
      sid: session.id,
      email: user.email,
    });

    // 7. Audit Event
    await this.auditRepository.create({
      tenantId: tenant.id,
      actorId: user.id,
      action: 'UserLoggedIn',
      resource: 'Session',
      resourceId: session.id,
      ipAddress,
    } as any);

    // 8. Publish Domain Event
    await this.eventPublisher.publish(
      'identity.events',
      'UserLoggedIn',
      { userId: user.id, email: user.email, sessionId: session.id },
      { tenantId: tenant.id }
    ).catch(e => console.error('Failed to publish UserLoggedIn event', e));

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour for access token
    };
  }

  async refresh(sessionId: string, refreshTokenPlain: string, ipAddress: string, userAgent: string) {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is invalid or expired.');
    }

    const isValidToken = await this.passwordHasher.verify(session.refreshTokenHash, refreshTokenPlain);
    if (!isValidToken) {
      // Possible token theft, revoke session
      await this.sessionRepository.revoke(session.id);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Rotate refresh token
    const newRefreshToken = randomBytes(32).toString('hex');
    const newRefreshTokenHash = await this.passwordHasher.hash(newRefreshToken);
    
    // In a real system, we'd update the session or create a new one to form a chain.
    // For simplicity, we just create a new session and revoke the old one.
    await this.sessionRepository.revoke(session.id);
    
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const newSession = await this.sessionRepository.create({
      userId: session.userId,
      tenantId: session.tenantId,
      refreshTokenHash: newRefreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt: newExpiresAt,
    });

    const user = await this.userRepository.findById(session.userId, session.tenantId);
    
    const accessToken = this.jwtService.sign({
      sub: user!.id,
      tid: session.tenantId,
      sid: newSession.id,
      email: user!.email,
    });

    await this.auditRepository.create({
      tenantId: session.tenantId,
      actorId: session.userId,
      action: 'TokenRefreshed',
      resource: 'Session',
      resourceId: newSession.id,
      ipAddress,
    } as any);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
    };
  }

  private async logFailedAttempt(tenantId: string | null, email: string, ipAddress: string, userAgent: string, reason: string) {
    // Just create a failed audit log (or use LoginAttempt entity)
    if (tenantId) {
      await this.auditRepository.create({
        tenantId,
        action: 'UserLoginFailed',
        resource: 'Auth',
        after: { email, reason },
        ipAddress,
      } as any);
    }
  }
}
