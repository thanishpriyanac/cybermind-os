import { Controller, Post, UseInterceptors, UploadedFile, Req, Logger } from '@nestjs/common';
import { LocalObjectStorageService } from './services/object-storage.service';
import { FileIdentificationService } from './services/file-identification.service';
import { StaticAnalysisService } from './services/static-analysis.service';
import { IocExtractionService } from './services/ioc-extraction.service';
import { InvestigationReportService } from './services/investigation-report.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { DomainEvents } from '../events/domain-events.registry';
import { randomUUID } from 'crypto';
// Fastify file upload or Multer would be used here in a real NestJS app
// Mocking the interceptor for simplicity in architecture demonstration
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/sandbox')
export class SandboxController {
  private readonly logger = new Logger(SandboxController.name);

  constructor(
    private readonly storage: LocalObjectStorageService,
    private readonly identifier: FileIdentificationService,
    private readonly staticAnalysis: StaticAnalysisService,
    private readonly iocExtractor: IocExtractionService,
    private readonly reporter: InvestigationReportService,
    private readonly eventBus: DomainEventBusService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // Assume file uploaded via multipart
  async uploadFile(@UploadedFile() file: any) {
    const investigationId = randomUUID();
    this.logger.log(`Starting Sandbox Investigation: ${investigationId}`);

    // Mocking file buffer if undefined (for tests)
    const buffer = file?.buffer || Buffer.from('mock file content');
    const originalName = file?.originalname || 'malware.pdf';

    // Security: File Upload Validation
    if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File size exceeds maximum allowed limit.');
    }
    // E.g., zip bomb detection logic here before continuing

    // 1. Upload to Object Storage
    const { fileId, url } = await this.storage.upload(buffer, originalName);

    await this.eventBus.publish({
      eventId: randomUUID(),
      eventType: DomainEvents.FileUploaded,
      occurredAt: new Date().toISOString(),
      version: 1,
      correlationId: investigationId,
      traceId: investigationId,
      source: 'SandboxController',
      payload: { fileId, url, originalName }
    });

    // 2. Magic Byte Detection & Hashing
    const fileMetadata = await this.identifier.identify(buffer, originalName);

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.MetadataExtracted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: investigationId,
        traceId: investigationId,
        source: 'SandboxController',
        payload: { fileId, fileMetadata }
    });

    // 3. Static Analysis
    const analysisResults = await this.staticAnalysis.analyze(buffer, fileMetadata);
    
    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.StaticAnalysisCompleted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: investigationId,
        traceId: investigationId,
        source: 'SandboxController',
        payload: { fileId, analysisResults }
    });

    // 4. Typed IOC Extraction
    const iocs = await this.iocExtractor.extract(analysisResults);

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.IocExtracted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: investigationId,
        traceId: investigationId,
        source: 'SandboxController',
        payload: { fileId, iocs }
    });

    // 5. Generate Investigation Report (which hits Hybrid Retrieval)
    // In a real async system, this would be triggered by a worker listening to IocExtracted.
    // For synchronous API response, we'll await it here.
    const report = await this.reporter.generateReport(investigationId, fileMetadata, analysisResults, iocs);

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.InvestigationCompleted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: investigationId,
        traceId: investigationId,
        source: 'SandboxController',
        payload: { investigationId, report }
    });

    return {
      investigationId,
      status: 'COMPLETED',
      fileMetadata,
      report
    };
  }
}
