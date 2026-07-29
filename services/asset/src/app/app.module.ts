import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssetController } from './asset.controller';
import { AssetDomainService } from '../domain/services/asset.domain.service';
import { AssetPrismaRepository } from '../infrastructure/persistence/prisma/asset.prisma.repository';
import { EventPlatformModule } from '../../../../packages/sdk/event-client/src/nestjs-integration';

@Module({
  imports: [
    EventPlatformModule.forRoot({
      clientId: 'asset-service',
      brokers: ['localhost:9092'],
      sourceName: '/cybermind/asset',
    }),
  ],
  controllers: [AppController, AssetController],
  providers: [
    AppService,
    AssetDomainService,
    { provide: 'IAssetRepository', useClass: AssetPrismaRepository },
  ],
})
export class AppModule {}
