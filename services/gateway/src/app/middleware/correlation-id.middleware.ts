import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.header('x-correlation-id') || uuidv4();
    
    // Attach to request
    req.headers['x-correlation-id'] = correlationId;
    
    // Attach to response for observability
    res.setHeader('x-correlation-id', correlationId);

    next();
  }
}
