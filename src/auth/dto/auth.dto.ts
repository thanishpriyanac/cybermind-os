import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@rexonsofttech.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SuperSecurePassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: 'temp_token_string' })
  @IsString()
  tempToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  code!: string;
}
