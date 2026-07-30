import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, VerifyMfaDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin Login Step 1' })
  @ApiResponse({ status: 200, description: 'Credentials verified; returns MFA challenge or tokens.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP MFA Code Step 2' })
  @ApiResponse({ status: 200, description: 'MFA verified; returns Access and Refresh JWT tokens.' })
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(dto);
  }
}
