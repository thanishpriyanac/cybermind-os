import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma, Asset, AssetIdentity, AssetRelationship, AssetRiskProfile } from '@prisma/client';
import { IAssetRepository } from '../../../domain/repositories/asset.repository';

@Injectable()
export class AssetPrismaRepository implements IAssetRepository {
  private readonly prisma = new PrismaClient();

  async create(data: Prisma.AssetUncheckedCreateInput): Promise<Asset> {
    return this.prisma.asset.create({ data });
  }

  async findById(id: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({ where: { id } });
  }

  async findByUniqueIdentifier(tenantId: string, uniqueIdentifier: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({
      where: { tenantId_uniqueIdentifier: { tenantId, uniqueIdentifier } },
    });
  }

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return this.prisma.asset.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({ where: { id } });
  }

  async addIdentity(data: Prisma.AssetIdentityUncheckedCreateInput): Promise<AssetIdentity> {
    return this.prisma.assetIdentity.create({ data });
  }

  async addRelationship(data: Prisma.AssetRelationshipUncheckedCreateInput): Promise<AssetRelationship> {
    return this.prisma.assetRelationship.create({ data });
  }

  async getRelationships(assetId: string): Promise<{ source: AssetRelationship[]; target: AssetRelationship[] }> {
    const [source, target] = await Promise.all([
      this.prisma.assetRelationship.findMany({ where: { sourceAssetId: assetId } }),
      this.prisma.assetRelationship.findMany({ where: { targetAssetId: assetId } }),
    ]);
    return { source, target };
  }

  async upsertRiskProfile(assetId: string, data: Omit<Prisma.AssetRiskProfileUncheckedCreateInput, 'assetId'>): Promise<AssetRiskProfile> {
    return this.prisma.assetRiskProfile.upsert({
      where: { assetId },
      create: { ...data, assetId },
      update: data,
    });
  }
}
