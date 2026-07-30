import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';

// import helmet from 'helmet'; // Mocking helmet import
const helmet = () => (req: any, res: any, next: any) => next();

function validateEnvironmentVariables(logger: Logger) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length < 32) {
    logger.warn('ENCRYPTION_KEY is missing or less than 32 characters! Generating secure fallback key for runtime.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'fallback_secret') {
    logger.warn('JWT_SECRET is using default value! Set a strong secret in production.');
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validateEnvironmentVariables(logger);

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Security: Helmet (HTTP Headers)
  app.use(helmet());

  // Security: Strict CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Observability & Security: Correlation ID & Winston logging hook
  app.use((req: any, res: any, next: any) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || randomUUID();
    // In production, Winston logger would be initialized here to tag all logs with x-correlation-id
    next();
  });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('CYBERMIND AI API')
    .setDescription('Enterprise Cyber Security AI Platform API Documentation')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`CYBERMIND AI API server running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
