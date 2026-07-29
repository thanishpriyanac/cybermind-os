import { Permission } from '@prisma/client';

export interface IPermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByResourceAction(resource: string, action: string): Promise<Permission | null>;
  create(data: Partial<Permission>): Promise<Permission>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Permission[]>;
}
