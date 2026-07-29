import { Role } from '@prisma/client';

export interface IRoleRepository {
  findById(id: string, tenantId: string): Promise<Role | null>;
  findByName(name: string, tenantId: string): Promise<Role | null>;
  create(data: Partial<Role>): Promise<Role>;
  update(id: string, data: Partial<Role>): Promise<Role>;
  delete(id: string): Promise<void>;
  assignPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
}
