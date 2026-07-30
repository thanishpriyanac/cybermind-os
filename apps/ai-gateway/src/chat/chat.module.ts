import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [HttpModule, ConversationModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
