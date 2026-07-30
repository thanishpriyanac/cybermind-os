import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      adminUser: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'jwt.expiresIn') return '15m';
              if (key === 'jwt.refreshExpiresIn') return '7d';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password with bcrypt', async () => {
    const rawPass = 'SuperPassword123!';
    const hashed = await service.hashPassword(rawPass);
    expect(hashed).toBeDefined();
    expect(hashed).not.toEqual(rawPass);

    const isValid = await service.verifyPassword(rawPass, hashed);
    expect(isValid).toBe(true);
  });

  it('should throw UnauthorizedException on invalid login credentials', async () => {
    prismaService.adminUser.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nonexistent@rexonsofttech.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
