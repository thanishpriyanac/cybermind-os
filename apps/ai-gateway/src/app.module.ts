import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [PrismaModule, AuthModule, ChatModule, ConversationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
