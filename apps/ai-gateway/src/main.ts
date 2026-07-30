import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  const router = app.getHttpAdapter().getInstance();
  router.get('/health', (req, res) => res.send({ status: 'ok' }));
  router.get('/ready', (req, res) => res.send({ status: 'ok' }));
  router.get('/live', (req, res) => res.send({ status: 'ok' }));

  await app.listen(3002);
  console.log('AI Gateway is running on http://localhost:3002');
}
bootstrap();
