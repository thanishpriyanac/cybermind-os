import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KeyManagerService } from '../key-manager/key-manager.service';
import { CreateApiKeyDto } from '../dto/gateway.dto';

@ApiTags('Admin - API Key Manager')
@Controller('admin/keys')
export class KeyManagerController {
  constructor(private readonly keyManagerService: KeyManagerService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered provider API keys (masked)' })
  async listKeys() {
    return this.keyManagerService.listKeysMasked();
  }

  @Post()
  @ApiOperation({ summary: 'Store new provider API key with envelope encryption' })
  async storeKey(@Body() dto: CreateApiKeyDto) {
    return this.keyManagerService.storeApiKey(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete provider API key' })
  async deleteKey(@Param('id') id: string) {
    return this.keyManagerService.deleteKey(id);
  }
}
