import { Session } from '@prisma/client';

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  create(data: Partial<Session>): Promise<Session>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  findActiveByUserId(userId: string): Promise<Session[]>;
}
