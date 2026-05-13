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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
// @UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(@Req() req, @Body() createCompanyDto: CreateCompanyDto) {
    console.log('Creating company with data:', createCompanyDto);
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  async findAll(@Req() req) {
    return this.companiesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  async findById(@Req() req, @Param('id') id: string) {
    return this.companiesService.findById(id, req.user.organizationId);
  }

  @Put(':id')
  async update(@Req() req, @Param('id') id: string, @Body() data: any) {
    return this.companiesService.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    return this.companiesService.delete(id, req.user.organizationId);
  }
}