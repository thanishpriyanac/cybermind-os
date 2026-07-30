import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EnvelopeEncryptedData {
  encryptedKey: string;
  encryptedDek: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class CryptoService {
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default_master_key_32_bytes_long_!';
    // Ensure master key is exactly 32 bytes for AES-256
    this.masterKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Envelope Encrypt plaintext data (API Key)
   */
  encryptApiKey(plainTextKey: string): EnvelopeEncryptedData {
    try {
      // 1. Generate random Data Encryption Key (DEK)
      const dek = crypto.randomBytes(32);
      const iv = crypto.randomBytes(12);

      // 2. Encrypt API key with DEK using AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      let encryptedKey = cipher.update(plainTextKey, 'utf8', 'hex');
      encryptedKey += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      // 3. Encrypt DEK with Master Key
      const dekIv = crypto.randomBytes(12);
      const dekCipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, dekIv);
      let encryptedDek = dekCipher.update(dek.toString('hex'), 'utf8', 'hex');
      encryptedDek += dekCipher.final('hex');
      const dekAuthTag = dekCipher.getAuthTag().toString('hex');

      // Store DEK payload as dekIv:encryptedDek:dekAuthTag
      const packagedDek = `${dekIv.toString('hex')}:${encryptedDek}:${dekAuthTag}`;

      return {
        encryptedKey,
        encryptedDek: packagedDek,
        iv: iv.toString('hex'),
        authTag,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to encrypt API key');
    }
  }

  /**
   * Decrypt API Key using Envelope Decryption
   */
  decryptApiKey(data: EnvelopeEncryptedData): string {
    try {
      // 1. Unpackage & Decrypt DEK using Master Key
      const [dekIvHex, encryptedDekHex, dekAuthTagHex] = data.encryptedDek.split(':');
      const dekIv = Buffer.from(dekIvHex, 'hex');
      const dekAuthTag = Buffer.from(dekAuthTagHex, 'hex');

      const dekDecipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, dekIv);
      dekDecipher.setAuthTag(dekAuthTag);
      let dekHex = dekDecipher.update(encryptedDekHex, 'hex', 'utf8');
      dekHex += dekDecipher.final('utf8');

      const dek = Buffer.from(dekHex, 'hex');

      // 2. Decrypt API Key using DEK
      const iv = Buffer.from(data.iv, 'hex');
      const authTag = Buffer.from(data.authTag, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAuthTag(authTag);
      let decryptedKey = decipher.update(data.encryptedKey, 'hex', 'utf8');
      decryptedKey += decipher.final('utf8');

      return decryptedKey;
    } catch (error) {
      throw new InternalServerErrorException('Failed to decrypt API key');
    }
  }
}
