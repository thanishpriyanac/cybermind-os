import { Injectable, Logger } from '@nestjs/common';

export interface SecretProvider {
  getSecret(key: string): Promise<string | undefined>;
}

class EnvSecretsProvider implements SecretProvider {
  async getSecret(key: string): Promise<string | undefined> {
    return process.env[key];
  }
}

class VaultSecretsProvider implements SecretProvider {
  async getSecret(key: string): Promise<string | undefined> {
    // Mock HashiCorp Vault lookup
    return undefined;
  }
}

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private providers: SecretProvider[] = [
    new VaultSecretsProvider(),
    new EnvSecretsProvider() // Fallback to .env
  ];

  async getSecret(key: string): Promise<string> {
    for (const provider of this.providers) {
      const secret = await provider.getSecret(key);
      if (secret) {
        return secret;
      }
    }
    this.logger.error(`Secret ${key} not found in any provider.`);
    throw new Error(`Secret ${key} not found.`);
  }
}
