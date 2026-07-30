import { Injectable, NotFoundException } from '@nestjs/common';
import { CryptoService } from '../crypto/crypto.service';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateApiKeyDto } from '../dto/gateway.dto';

@Injectable()
export class KeyManagerService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly keyRepo: ApiKeyRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async storeApiKey(dto: CreateApiKeyDto, actor: string = 'admin') {
    // 1. Envelope Encrypt API key
    const envelope = this.cryptoService.encryptApiKey(dto.rawApiKey);

    // 2. Persist in database
    const keyRecord = await this.keyRepo.createKey(dto.provider, dto.keyName, envelope);

    // 3. Audit Log (Never log raw or encrypted key data)
    await this.auditRepo.log('API_KEY_CREATED', actor, {
      keyId: keyRecord.id,
      provider: dto.provider,
      keyName: dto.keyName,
    });

    return {
      id: keyRecord.id,
      provider: keyRecord.provider,
      keyName: keyRecord.keyName,
      status: 'ENCRYPTED_AND_STORED',
    };
  }

  async getDecryptedKeyForProvider(provider: string): Promise<string | null> {
    const keyRecord = await this.keyRepo.findActiveByProvider(provider);
    if (!keyRecord) return null;

    return this.cryptoService.decryptApiKey({
      encryptedKey: keyRecord.encryptedKey,
      encryptedDek: keyRecord.encryptedDek,
      iv: keyRecord.iv,
      authTag: keyRecord.authTag,
    });
  }

  async listKeysMasked() {
    return this.keyRepo.findAllMasked();
  }

  async deleteKey(id: string, actor: string = 'admin') {
    const deleted = await this.keyRepo.deleteKey(id);
    await this.auditRepo.log('API_KEY_DELETED', actor, { keyId: id });
    return deleted;
  }
}
