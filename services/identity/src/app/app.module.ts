import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthController } from './auth.controller';
import { AuthDomainService } from '../domain/services/auth.domain.service';
import { UserDomainService } from '../domain/services/user.domain.service';
import { TenantDomainService } from '../domain/services/tenant.domain.service';
import { Argon2PasswordHasher } from '../domain/services/password-hasher/argon2-password-hasher';
import { TenantPrismaRepository, UserPrismaRepository, RolePrismaRepository, PermissionPrismaRepository, SessionPrismaRepository, AuditPrismaRepository } from '../infrastructure/persistence/prisma';
import { PrismaClient } from '@prisma/client';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { EventPlatformModule } from '@cybermind-os/event-client';
import * as fs from 'fs';
import * as path from 'path';

const privateKey = fs.existsSync(path.join(process.cwd(), 'keys', 'private.pem')) ? fs.readFileSync(path.join(process.cwd(), 'keys', 'private.pem'), 'utf8') : 'DUMMY';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      privateKey: privateKey,
      signOptions: { algorithm: 'RS256' },
    }),
    EventPlatformModule.forRoot({
      clientId: 'identity-service',
      brokers: ['localhost:9092'], // Should use env var in prod
      sourceName: '/cybermind/identity',
    }),
  ],
  controllers: [AppController, HealthController, AuthController],
  providers: [
    AppService,
    PrismaClient,
    AuthDomainService,
    UserDomainService,
    TenantDomainService,
    JwtStrategy,
    { provide: 'IPasswordHasher', useClass: Argon2PasswordHasher },
    { provide: 'ITenantRepository', useClass: TenantPrismaRepository },
    { provide: 'IUserRepository', useClass: UserPrismaRepository },
    { provide: 'IRoleRepository', useClass: RolePrismaRepository },
    { provide: 'IPermissionRepository', useClass: PermissionPrismaRepository },
    { provide: 'ISessionRepository', useClass: SessionPrismaRepository },
    { provide: 'IAuditRepository', useClass: AuditPrismaRepository },
  ],
})
export class AppModule {}
