import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);
  
  private readonly client = jwksClient({
    jwksUri: 'http://identity:3001/auth/.well-known/jwks.json',
    cache: true,
    cacheMaxEntries: 5, // Default value
    cacheMaxAge: 600000, // 10 mins
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  private getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        this.logger.error(`Failed to retrieve signing key for kid: ${header.kid}`, err);
        callback(err, undefined);
      } else {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      }
    });
  };

  use(req: Request, res: Response, next: NextFunction) {
    // Exclude certain paths from JWT validation (e.g., login, jwks, health)
    const publicPaths = ['/api/v1/identity/auth/login', '/api/v1/identity/auth/.well-known/jwks.json', '/health'];
    if (publicPaths.some(p => req.path.startsWith(p))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, this.getKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
      if (err) {
        throw new UnauthorizedException(`JWT Validation failed: ${err.message}`);
      }

      // Strict Tenant Extraction - Overwrite any client-provided x-tenant-id
      if (decoded.tid) {
        req.headers['x-tenant-id'] = decoded.tid;
      } else {
        throw new UnauthorizedException('Tenant context missing from JWT');
      }

      // Optionally attach user context to headers for backend parsing
      req.headers['x-user-id'] = decoded.sub;

      next();
    });
  }
}
