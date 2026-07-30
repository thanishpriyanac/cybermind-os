import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FanOutMode {
  SMART = 'SMART',
  FULL_FAN_OUT = 'FULL_FAN_OUT',
}

export class CreateTurnDto {
  @ApiProperty({ example: 'What are the MITRE techniques and mitigation steps for CVE-2024-3094?' })
  @IsString()
  promptText!: string;

  @ApiProperty({ example: 'SMART', enum: FanOutMode })
  @IsEnum(FanOutMode)
  mode!: FanOutMode;

  @ApiProperty({ example: ['gpt-4o', 'claude-3-5-sonnet'], required: false })
  @IsArray()
  @IsOptional()
  overrideModels?: string[];
}
