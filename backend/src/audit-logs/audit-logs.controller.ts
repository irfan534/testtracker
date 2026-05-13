import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'AUDITOR')
  async findAll(@Req() req, @Query('skip') skip = 0, @Query('take') take = 50) {
    return this.auditLogsService.findAll(req.user.organizationId, skip, take);
  }

  @Get('user')
  async findByUser(@Req() req, @Query('skip') skip = 0, @Query('take') take = 50) {
    return this.auditLogsService.findByUser(req.user.id, req.user.organizationId, skip, take);
  }
}
