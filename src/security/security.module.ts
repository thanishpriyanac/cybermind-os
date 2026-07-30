import { Module, Global } from '@nestjs/common';
import { SecretsService } from './services/secrets.service';

@Global()
@Module({
  providers: [SecretsService],
  exports: [SecretsService],
})
export class SecurityModule {}
