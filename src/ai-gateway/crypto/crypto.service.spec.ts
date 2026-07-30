import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService (Envelope Encryption)', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'ENCRYPTION_KEY') return 'test_master_encryption_key_32bytes!';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt an API key successfully (round-trip)', () => {
    const secretApiKey = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = service.encryptApiKey(secretApiKey);

    expect(encrypted.encryptedKey).toBeDefined();
    expect(encrypted.encryptedDek).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.encryptedKey).not.toEqual(secretApiKey);

    const decrypted = service.decryptApiKey(encrypted);
    expect(decrypted).toEqual(secretApiKey);
  });

  it('should generate unique DEKs and IVs for identical plaintexts', () => {
    const secretApiKey = 'sk-proj-same-key';
    const encrypted1 = service.encryptApiKey(secretApiKey);
    const encrypted2 = service.encryptApiKey(secretApiKey);

    expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    expect(encrypted1.encryptedKey).not.toEqual(encrypted2.encryptedKey);

    expect(service.decryptApiKey(encrypted1)).toEqual(secretApiKey);
    expect(service.decryptApiKey(encrypted2)).toEqual(secretApiKey);
  });
});
