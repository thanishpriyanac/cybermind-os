import { Controller, Post, Body, Req, UseGuards, Ip, Get, Res } from '@nestjs/common';
import { AuthDomainService } from '../domain/services/auth.domain.service';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { TenantGuard } from '../infrastructure/auth/tenant.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthDomainService) {}

  @Post('login')
  async login(@Body() body: any, @Req() req: any, @Ip() ip: string) {
    const { tenantSlug, email, password } = body;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return this.authService.login(tenantSlug, email, password, ip, userAgent);
  }

  @Post('refresh')
  async refresh(@Body() body: any, @Req() req: any, @Ip() ip: string) {
    const { sessionId, refreshToken } = body;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return this.authService.refresh(sessionId, refreshToken, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('me')
  async me(@Req() req: any) {
    return {
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      email: req.user.email,
    };
  }

  @Get('.well-known/jwks.json')
  getJwks(@Res() res: any) {
    // In production, we'd use a JWKS generator library to parse the PEM and return the JWK format.
    // For now, we simulate returning the public key directly or minimal JWKS structure.
    const publicKey = fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8');
    // Generating a basic JWKS format is typically done via libraries like 'pem-jwk' or 'node-jose'.
    // Here we just return the raw PEM as a custom property for simplicity until a JWKS lib is added.
    res.json({
      keys: [
        {
          kty: 'RSA',
          alg: 'RS256',
          use: 'sig',
          kid: 'cybermind-key-1',
          x5c: [
            Buffer.from(publicKey).toString('base64')
          ]
        }
      ]
    });
  }
}
