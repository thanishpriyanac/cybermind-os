import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { RedisPubSubService } from '../events/redis-pubsub.service';

@Injectable()
export class SseMultiplexerService {
  private readonly logger = new Logger(SseMultiplexerService.name);

  constructor(private readonly pubsub: RedisPubSubService) {}

  /**
   * Multiplexes provider event stream over a single SSE HTTP connection
   */
  connectStream(conversationId: string, res: Response) {
    const channel = `conversation:${conversationId}:stream`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering for Cloudflare/Nginx

    res.write(`event: connected\ndata: ${JSON.stringify({ conversationId, status: 'STREAM_CONNECTED' })}\n\n`);

    this.pubsub.subscribe(channel, (rawMessage) => {
      try {
        const parsed = JSON.parse(rawMessage);
        const eventName = parsed.event || 'message';
        const dataPayload = JSON.stringify(parsed.data || {});

        res.write(`event: ${eventName}\ndata: ${dataPayload}\n\n`);
      } catch (err) {
        this.logger.error(`Error formatting SSE message for conversation ${conversationId}`, err);
      }
    });

    res.on('close', () => {
      this.logger.log(`SSE client disconnected from conversation ${conversationId}`);
      res.end();
    });
  }
}
