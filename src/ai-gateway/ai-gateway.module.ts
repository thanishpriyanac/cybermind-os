import { Module } from '@nestjs/common';
import { CryptoService } from './crypto/crypto.service';
import { CostEngineService } from './cost-engine/cost-engine.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { SmartRouterService } from './router/smart-router.service';

import { OpenAIProviderAdapter } from './providers/openai.provider';
import { AnthropicProviderAdapter, GeminiProviderAdapter, OllamaProviderAdapter } from './providers/provider-adapters';

import { ProviderModelRepository } from './repositories/provider-model.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

import { RegistryService } from './registry/registry.service';
import { KeyManagerService } from './key-manager/key-manager.service';

import { RegistryController } from './controllers/registry.controller';
import { KeyManagerController } from './controllers/key-manager.controller';

@Module({
  controllers: [RegistryController, KeyManagerController],
  providers: [
    CryptoService,
    CostEngineService,
    CircuitBreakerService,
    SmartRouterService,
    OpenAIProviderAdapter,
    AnthropicProviderAdapter,
    GeminiProviderAdapter,
    OllamaProviderAdapter,
    ProviderModelRepository,
    ApiKeyRepository,
    AuditLogRepository,
    RegistryService,
    KeyManagerService,
  ],
  exports: [
    CryptoService,
    CostEngineService,
    CircuitBreakerService,
    SmartRouterService,
    RegistryService,
    KeyManagerService,
    ProviderModelRepository,
    ApiKeyRepository,
    AuditLogRepository,
  ],
})
export class AiGatewayModule {}
