import { Controller, Post, Body, UseGuards, Req, Res, HttpCode, Get, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Setup2FADto, Verify2FADto, Disable2FADto } from './dto/2fa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req) {
    try {
      return await this.authService.register(registerDto, req);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res() res: Response, @Req() req) {
    const result = await this.authService.login(loginDto, req);
    
    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === 'true',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('logout')
  async logout(@Req() req, @Res() res: Response) {
    try {
      // Try to get user info if authenticated, but don't require it
      if (req.user) {
        await this.authService.logout(req.user.id, req);
      }
    } catch (error) {
      // Continue with logout even if user service fails
      console.log('Logout called without valid session');
    }
    
    // Always clear cookies and return success
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const result = await this.authService.refreshToken(refreshToken, req);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === 'true',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: result.accessToken,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req) {
    return this.authService.getCurrentUser(req.user.id);
  }

  // 2FA Endpoints
  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async setup2FA(@Req() req) {
    return this.authService.setup2FA(req.user.id, req);
  }

  @Post('2fa/verify-setup')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async verify2FASetup(@Body() dto: Verify2FADto, @Req() req) {
    return this.authService.verify2FASetup(req.user.id, dto.code, req);
  }

  @Post('2fa/verify')
  @HttpCode(200)
  async verify2FALogin(@Body() dto: Verify2FADto, @Req() req, @Res() res: Response) {
    const result = await this.authService.verify2FALogin(
      dto.userId || req.user?.id,
      dto.code,
      dto.tempToken,
      req
    );

    // Set refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === 'true',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async disable2FA(@Body() dto: Disable2FADto, @Req() req, @Res() res: Response) {
    await this.authService.disable2FA(req.user.id, dto.code, req);

    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({ message: 'Two-factor authentication disabled successfully. Please log in again.' });
  }

  @Get('2fa/status')
  @UseGuards(AuthGuard('jwt'))
  async get2FAStatus(@Req() req) {
    return this.authService.get2FAStatus(req.user.id);
  }

  @Post('2fa/regenerate-backup-codes')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async regenerateBackupCodes(@Body() dto: Verify2FADto, @Req() req) {
    return this.authService.regenerateBackupCodes(req.user.id, dto.code, req);
  }
}
