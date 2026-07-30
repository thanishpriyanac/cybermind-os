import { Module } from '@nestjs/common';
import { AuditWorker } from './audit.worker';

@Module({
  providers: [AuditWorker],
})
export class AuditModule {}
