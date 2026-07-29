import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAssetRepository } from '../repositories/asset.repository';
import { Prisma } from '@prisma/client';
import { CybermindKafkaPublisher } from '../../../../../packages/sdk/event-client/src/kafka-publisher';

@Injectable()
export class AssetDomainService {
  constructor(
    @Inject('IAssetRepository') private readonly assetRepository: IAssetRepository,
    private readonly eventPublisher: CybermindKafkaPublisher,
  ) {}

  async createAsset(tenantId: string, actorId: string, data: Omit<Prisma.AssetUncheckedCreateInput, 'tenantId'>) {
    const existing = await this.assetRepository.findByUniqueIdentifier(tenantId, data.uniqueIdentifier);
    if (existing) {
      throw new BadRequestException(`Asset with uniqueIdentifier ${data.uniqueIdentifier} already exists in this tenant`);
    }

    const asset = await this.assetRepository.create({ ...data, tenantId });

    await this.eventPublisher.publish(
      'asset.events',
      'AssetCreated',
      { assetId: asset.id, ...data },
      { tenantId, actorId }
    ).catch(e => console.error('Failed to publish AssetCreated', e));

    return asset;
  }

  async getAsset(tenantId: string, assetId: string) {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset || asset.tenantId !== tenantId) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async addRelationship(tenantId: string, actorId: string, sourceAssetId: string, targetAssetId: string, type: string) {
    // Validate both assets belong to tenant
    await this.getAsset(tenantId, sourceAssetId);
    await this.getAsset(tenantId, targetAssetId);

    const rel = await this.assetRepository.addRelationship({
      tenantId,
      sourceAssetId,
      targetAssetId,
      type,
    });

    await this.eventPublisher.publish(
      'asset.events',
      'AssetRelationshipCreated',
      { sourceAssetId, targetAssetId, type },
      { tenantId, actorId }
    ).catch(e => console.error('Failed to publish AssetRelationshipCreated', e));

    return rel;
  }

  async getRelationships(tenantId: string, assetId: string) {
    await this.getAsset(tenantId, assetId);
    return this.assetRepository.getRelationships(assetId);
  }
}
