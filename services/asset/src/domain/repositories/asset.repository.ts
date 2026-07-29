import { Prisma, Asset, AssetIdentity, AssetRelationship, AssetRiskProfile } from '@prisma/client';

export interface IAssetRepository {
  create(data: Prisma.AssetUncheckedCreateInput): Promise<Asset>;
  findById(id: string): Promise<Asset | null>;
  findByUniqueIdentifier(tenantId: string, uniqueIdentifier: string): Promise<Asset | null>;
  update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset>;
  delete(id: string): Promise<void>;
  
  // Identities
  addIdentity(data: Prisma.AssetIdentityUncheckedCreateInput): Promise<AssetIdentity>;
  
  // Relationships
  addRelationship(data: Prisma.AssetRelationshipUncheckedCreateInput): Promise<AssetRelationship>;
  getRelationships(assetId: string): Promise<{ source: AssetRelationship[]; target: AssetRelationship[] }>;

  // Risk Profile
  upsertRiskProfile(assetId: string, data: Omit<Prisma.AssetRiskProfileUncheckedCreateInput, 'assetId'>): Promise<AssetRiskProfile>;
}
