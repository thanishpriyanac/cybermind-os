import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../repositories/user.repository';
import { ITenantRepository } from '../repositories/tenant.repository';
import { IRoleRepository } from '../repositories/role.repository';
import { IPasswordHasher } from './password-hasher/password-hasher.interface';
import { CybermindKafkaPublisher } from '../../../../../packages/sdk/event-client/src/kafka-publisher';

@Injectable()
export class UserDomainService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository') private readonly tenantRepository: ITenantRepository,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    @Inject('IPasswordHasher') private readonly passwordHasher: IPasswordHasher,
    private readonly eventPublisher: CybermindKafkaPublisher,
  ) {}

  async createUser(tenantId: string, email: string, passwordPlain: string, roleName?: string) {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (existingUser) throw new BadRequestException('User already exists');

    const passwordHash = await this.passwordHasher.hash(passwordPlain);
    
    const user = await this.userRepository.create({
      tenantId,
      email,
      passwordHash,
      status: 'ACTIVE',
    });

    if (roleName) {
      const role = await this.roleRepository.findByName(roleName, tenantId);
      if (role) {
        await this.userRepository.assignRole(user.id, role.id);
      }
    }

    await this.eventPublisher.publish(
      'identity.events',
      'UserCreated',
      { userId: user.id, email: user.email, status: user.status },
      { tenantId }
    ).catch(e => console.error('Failed to publish UserCreated event', e));

    return user;
  }
}
