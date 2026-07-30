import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvelopeEncryptedData } from '../crypto/crypto.service';

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createKey(provider: string, keyName: string, envelope: EnvelopeEncryptedData) {
    return this.prisma.apiKey.create({
      data: {
        provider,
        keyName,
        encryptedKey: envelope.encryptedKey,
        encryptedDek: envelope.encryptedDek,
        iv: envelope.iv,
        authTag: envelope.authTag,
      },
    });
  }

  async findActiveByProvider(provider: string) {
    return this.prisma.apiKey.findFirst({
      where: { provider, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllMasked() {
    const keys = await this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      keyName: k.keyName,
      isActive: k.isActive,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));
  }

  async deleteKey(id: string) {
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }
}
