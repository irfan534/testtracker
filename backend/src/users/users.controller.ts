import { Controller, Get, UseGuards, Req, Body, Put, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    // Ensure we are updating own profile
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('organization')
  @Roles('SUPER_ADMIN', 'COMPLIANCE_MANAGER', 'AUDITOR')
  async getOrganizationUsers(@Req() req) {
    return this.usersService.findAll(req.user.organizationId);
  }
}
