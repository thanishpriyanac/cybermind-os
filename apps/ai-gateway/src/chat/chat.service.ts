import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConversationService } from '../conversation/conversation.service';
import { Response } from 'express';

@Injectable()
export class ChatService {
  constructor(
    private readonly httpService: HttpService,
    private readonly conversationService: ConversationService
  ) {}

  async processChat(
    userId: string,
    messageContent: string,
    systemPromptId: string,
    conversationId: string | null,
    res: Response
  ) {
    // 1. Resolve or create conversation
    let conversation;
    let history = [];
    
    if (conversationId) {
      conversation = await this.conversationService.getConversation(conversationId, userId);
      history = conversation.messages.map(m => ({
        role: m.role,
        content: m.content
      }));
    } else {
      conversation = await this.conversationService.createConversation(userId, 'New Conversation');
    }

    // Prepare new message payload
    const newMessages = [...history, { role: 'user', content: messageContent }];

    try {
      // 2. Call FastAPI AI Service with streaming
      const aiResponse = await this.httpService.axiosRef.post('http://127.0.0.1:8000/chat', {
        conversationId: conversation.id,
        systemPrompt: systemPromptId,
        messages: newMessages,
        metadata: { userId }
      }, {
        responseType: 'stream'
      });

      // 3. Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Return the conversation ID first as requested
      res.write(`data: {"conversationId": "${conversation.id}"}\n\n`);

      let fullAssistantContent = '';
      let metrics = null;

      // 4. Proxy stream chunks and capture content
      aiResponse.data.on('data', async (chunk: Buffer) => {
        const chunkString = chunk.toString();
        // Forward to client immediately
        res.write(chunkString);
        
        // Parse the chunk to capture content for DB
        // Chunk format from FastAPI is `data: {...}\n\n`
        const parts = chunkString.split('data: ');
        for (const part of parts) {
          if (part.trim() === '') continue;
          try {
            const parsed = JSON.parse(part.trim());
            if (parsed.type === 'complete') {
              fullAssistantContent = parsed.content;
              metrics = parsed.metrics;
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunks
          }
        }
      });

      aiResponse.data.on('end', async () => {
        // 5. Persist to Database on complete
        await this.conversationService.addMessage(conversation.id, 'user', messageContent);
        if (fullAssistantContent) {
          await this.conversationService.addMessage(
            conversation.id, 
            'assistant', 
            fullAssistantContent, 
            metrics
          );
        }
        res.end();
      });
      
      aiResponse.data.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
      });

    } catch (error) {
      console.error('Error communicating with AI Service:', error);
      res.status(500).json({ error: 'AI Service is unavailable' });
    }
  }
}
