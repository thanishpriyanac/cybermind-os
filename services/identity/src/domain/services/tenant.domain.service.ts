import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ITenantRepository } from '../repositories/tenant.repository';
import { CybermindKafkaPublisher } from '@cybermind-os/event-client';

@Injectable()
export class TenantDomainService {
  constructor(
    @Inject('ITenantRepository') private readonly tenantRepository: ITenantRepository,
    private readonly eventPublisher: CybermindKafkaPublisher,
  ) {}

  async createTenant(name: string, slug: string) {
    const existing = await this.tenantRepository.findBySlug(slug);
    if (existing) {
      throw new BadRequestException('Tenant slug already in use');
    }

    const tenant = await this.tenantRepository.create({
      name,
      slug,
      status: 'ACTIVE',
    });

    await this.eventPublisher.publish(
      'identity.events',
      'TenantCreated',
      { tenantId: tenant.id, name, slug },
      { tenantId: tenant.id }
    ).catch(e => console.error('Failed to publish TenantCreated event', e));

    return tenant;
  }
}
