import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessage(
    @Req() req: Request,
    @Res() res: Response,
    @Body('message') message: string,
    @Body('systemPrompt') systemPrompt: string = 'system',
    @Body('conversationId') conversationId: string = null
  ) {
    const user = req.user as any; // From Passport JWT Strategy
    await this.chatService.processChat(
      user.id,
      message,
      systemPrompt,
      conversationId,
      res
    );
  }
}
