import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, title: string = 'New Conversation') {
    return this.prisma.conversation.create({
      data: {
        userId,
        title,
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    return conversation;
  }

  async addMessage(
    conversationId: string, 
    role: string, 
    content: string, 
    metrics?: {
      model?: string;
      provider?: string;
      promptVersion?: string;
      latencyMs?: number;
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    }
  ) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        model: metrics?.model,
        provider: metrics?.provider,
        promptVersion: metrics?.promptVersion,
        latencyMs: metrics?.latencyMs,
        inputTokens: metrics?.inputTokens,
        outputTokens: metrics?.outputTokens,
        totalTokens: metrics?.totalTokens,
      },
    });
  }
}
