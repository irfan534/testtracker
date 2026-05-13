import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';

@Controller('certifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER')
  async create(@Req() req, @Body() createCertificationDto: CreateCertificationDto) {
    return this.certificationsService.create(
      req.user.organizationId,
      req.user.id,
      createCertificationDto,
    );
  }

  @Get()
  async findAll(@Req() req, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.certificationsService.findAll(req.user.organizationId, skip, take);
  }

  @Get('metrics')
  async getMetrics(@Req() req) {
    return this.certificationsService.getExpiryMetrics(req.user.organizationId);
  }

  @Get(':id')
  async findById(@Req() req, @Param('id') id: string) {
    return this.certificationsService.findById(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER')
  async update(@Req() req, @Param('id') id: string, @Body() data: any) {
    return this.certificationsService.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER')
  async delete(@Req() req, @Param('id') id: string) {
    return this.certificationsService.delete(id, req.user.organizationId);
  }
}
