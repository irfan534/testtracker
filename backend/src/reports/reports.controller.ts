import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('expiry-forecast')
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER', 'AUDITOR')
  async getExpiryReport(@Req() req) {
    return this.reportsService.generateExpiryReport(req.user.organizationId);
  }

  @Get('compliance-status')
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER', 'AUDITOR')
  async getComplianceReport(@Req() req) {
    return this.reportsService.generateComplianceReport(req.user.organizationId);
  }
}
