import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProviderModelDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  provider!: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  modelKey!: string;

  @ApiProperty({ example: 'OpenAI GPT-4o' })
  @IsString()
  displayName!: string;

  @ApiProperty({ example: 128000 })
  @IsNumber()
  contextWindow!: number;

  @ApiProperty({ example: 4096 })
  @IsNumber()
  maxOutputTokens!: number;

  @ApiProperty({ example: 0.005 })
  @IsNumber()
  costPerInput1k!: number;

  @ApiProperty({ example: 0.015 })
  @IsNumber()
  costPerOutput1k!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  supportsStreaming?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  supportsVision?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  supportsTools?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  supportsEmbedding?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isLocal?: boolean;
}

export class UpdateModelHealthDto {
  @ApiProperty({ example: 'ONLINE', enum: ['ONLINE', 'OFFLINE', 'DEGRADED', 'CIRCUIT_OPEN'] })
  @IsEnum(['ONLINE', 'OFFLINE', 'DEGRADED', 'CIRCUIT_OPEN'])
  healthStatus!: string;
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  provider!: string;

  @ApiProperty({ example: 'Production OpenAI Key' })
  @IsString()
  keyName!: string;

  @ApiProperty({ example: 'sk-proj-xxxx' })
  @IsString()
  rawApiKey!: string;
}
