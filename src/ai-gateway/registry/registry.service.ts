import { Injectable, NotFoundException } from '@nestjs/common';
import { ProviderModelRepository } from '../repositories/provider-model.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateProviderModelDto } from '../dto/gateway.dto';

@Injectable()
export class RegistryService {
  constructor(
    private readonly modelRepo: ProviderModelRepository,
    private readonly auditRepo: AuditLogRepository,
  ) {}

  async getAllModels() {
    return this.modelRepo.findAll();
  }

  async getActiveModels() {
    return this.modelRepo.findActive();
  }

  async registerOrUpdateModel(dto: CreateProviderModelDto, actor: string = 'admin') {
    const model = await this.modelRepo.upsert(dto);
    await this.auditRepo.log('MODEL_REGISTERED', actor, { modelKey: dto.modelKey, provider: dto.provider });
    return model;
  }

  async toggleModelActive(modelKey: string, isActive: boolean, actor: string = 'admin') {
    const model = await this.modelRepo.findByKey(modelKey);
    if (!model) {
      throw new NotFoundException(`Model ${modelKey} not found in registry`);
    }

    const updated = await this.modelRepo.toggleActive(modelKey, isActive);
    await this.auditRepo.log('MODEL_TOGGLED', actor, { modelKey, isActive });
    return updated;
  }

  async updateHealth(modelKey: string, healthStatus: string, isSuccess: boolean) {
    return this.modelRepo.updateHealth(modelKey, healthStatus, isSuccess);
  }
}
