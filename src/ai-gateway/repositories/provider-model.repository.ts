import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderModelDto } from '../dto/gateway.dto';

@Injectable()
export class ProviderModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.providerConfiguration.findMany({
      orderBy: { provider: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.providerConfiguration.findMany({
      where: { isActive: true },
    });
  }

  async findByKey(modelKey: string) {
    return this.prisma.providerConfiguration.findUnique({
      where: { modelKey },
    });
  }

  async upsert(dto: CreateProviderModelDto) {
    return this.prisma.providerConfiguration.upsert({
      where: { modelKey: dto.modelKey },
      update: {
        displayName: dto.displayName,
        contextWindow: dto.contextWindow,
        maxOutputTokens: dto.maxOutputTokens,
        costPerInput1k: dto.costPerInput1k,
        costPerOutput1k: dto.costPerOutput1k,
        supportsStreaming: dto.supportsStreaming ?? true,
        supportsVision: dto.supportsVision ?? false,
        supportsTools: dto.supportsTools ?? false,
        supportsEmbedding: dto.supportsEmbedding ?? false,
        isLocal: dto.isLocal ?? false,
      },
      create: {
        provider: dto.provider,
        modelKey: dto.modelKey,
        displayName: dto.displayName,
        contextWindow: dto.contextWindow,
        maxOutputTokens: dto.maxOutputTokens,
        costPerInput1k: dto.costPerInput1k,
        costPerOutput1k: dto.costPerOutput1k,
        supportsStreaming: dto.supportsStreaming ?? true,
        supportsVision: dto.supportsVision ?? false,
        supportsTools: dto.supportsTools ?? false,
        supportsEmbedding: dto.supportsEmbedding ?? false,
        isLocal: dto.isLocal ?? false,
      },
    });
  }

  async updateHealth(modelKey: string, status: string, isSuccess: boolean) {
    const data: any = { healthStatus: status };
    if (isSuccess) {
      data.lastSuccessAt = new Date();
    } else {
      data.lastFailureAt = new Date();
    }

    return this.prisma.providerConfiguration.update({
      where: { modelKey },
      data,
    });
  }

  async toggleActive(modelKey: string, isActive: boolean) {
    return this.prisma.providerConfiguration.update({
      where: { modelKey },
      data: { isActive },
    });
  }
}
