import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface ObjectStorageService {
    upload(fileBuffer: Buffer, originalName: string): Promise<{ fileId: string, url: string }>;
    download(fileId: string): Promise<Buffer>;
    delete(fileId: string): Promise<void>;
    exists(fileId: string): Promise<boolean>;
    generateSignedUrl(fileId: string): Promise<string>;
}

@Injectable()
export class LocalObjectStorageService implements ObjectStorageService {
  private readonly logger = new Logger(LocalObjectStorageService.name);
  private readonly storageDir = path.join(process.cwd(), 'storage');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, originalName: string): Promise<{ fileId: string, url: string }> {
    const fileId = randomUUID() + '_' + originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(this.storageDir, fileId);
    
    await fs.promises.writeFile(filePath, fileBuffer);
    this.logger.log(`Uploaded file ${originalName} to local storage as ${fileId}`);
    
    return {
      fileId,
      url: `file://${filePath}` // Mock URL for now
    };
  }

  async download(fileId: string): Promise<Buffer> {
    const filePath = path.join(this.storageDir, fileId);
    return fs.promises.readFile(filePath);
  }

  async delete(fileId: string): Promise<void> {
    const filePath = path.join(this.storageDir, fileId);
    await fs.promises.unlink(filePath);
  }

  async exists(fileId: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, fileId);
    return fs.existsSync(filePath);
  }

  async generateSignedUrl(fileId: string): Promise<string> {
    // Mock signed URL
    return `http://localhost:3000/api/storage/download/${fileId}?token=mock_signed_token`;
  }
}
