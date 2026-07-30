import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, VerifyMfaDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await this.verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled && user.mfaSecret) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'TEMP_MFA' },
        { expiresIn: '5m' },
      );
      return {
        mfaRequired: true,
        tempToken,
      };
    }

    return this.generateAndStoreTokens(user.id, user.email);
  }

  async verifyMfa(dto: VerifyMfaDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA session token');
    }

    if (payload.type !== 'TEMP_MFA') {
      throw new UnauthorizedException('Invalid token type for MFA verification');
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('User MFA secret not found');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA TOTP code');
    }

    return this.generateAndStoreTokens(user.id, user.email);
  }

  async rotateRefreshToken(refreshTokenString: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshTokenString);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or revoked');
    }

    // Revoke old token (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateAndStoreTokens(payload.sub, payload.email);
  }

  private async generateAndStoreTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: this.configService.get('jwt.expiresIn') },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, email, type: 'REFRESH' },
      { expiresIn: this.configService.get('jwt.refreshExpiresIn') },
    );

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
