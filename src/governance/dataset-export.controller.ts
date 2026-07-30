import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DatasetExportService } from './services/dataset-export.service';
import { StixExportService } from './services/stix-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/constants/roles';

@Controller('api/governance/export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatasetExportController {
  constructor(
      private readonly exportService: DatasetExportService,
      private readonly stixService: StixExportService
  ) {}

  @Post('jsonl')
  @Roles(Role.ADMIN, Role.SENIOR_ANALYST)
  async exportJsonl(@Res() res: Response) {
    const filePath = await this.exportService.generateDataset();
    return res.download(filePath);
  }

  @Post('stix')
  @Roles(Role.ADMIN, Role.SENIOR_ANALYST)
  async exportStix(@Res() res: Response) {
      const bundle = await this.stixService.generateStixBundle();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="cybermind_stix_bundle.json"');
      return res.send(bundle);
  }
}
