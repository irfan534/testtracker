import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditAction, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Mock 2FA state for demo purposes when database is not available
  private mock2FAState: Map<string, { mfaEnabled: boolean; mfaSecret?: string; backupCodes?: string[] }> = new Map();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private async createAuditLog(
    action: AuditAction,
    severity: AuditSeverity,
    details: string,
    organizationId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          severity,
          details,
          userId,
          organizationId,
          ipAddress,
          userAgent,
          entityType: 'USER',
          changes: metadata || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }

  async register(registerDto: RegisterDto, req?: any) {
    const { email, password, firstName, lastName } = registerDto;

    try {
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        throw new BadRequestException('All fields are required');
      }

      if (password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await this.createAuditLog(
          AuditAction.USER_CREATED,
          AuditSeverity.WARNING,
          `Registration attempt with existing email: ${email}`,
          existingUser.organizationId,
          undefined,
          req?.ip,
          req?.get('user-agent'),
          { email, success: false, reason: 'User already exists' }
        );
        throw new BadRequestException('User already exists');
      }

      // Hash password using Argon2id with secure parameters
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        saltLength: 16,
        hashLength: 32,
      });

      // Create organization
      const organization = await this.prisma.organization.create({
        data: {
          name: `${firstName} ${lastName}'s Organization`,
          industry: 'Technology',
          size: 'small',
        },
      });

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          organizationId: organization.id,
          emailVerified: false,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true,
          status: true,
        },
      });

      // Create audit log
      await this.createAuditLog(
        AuditAction.USER_CREATED,
        AuditSeverity.INFO,
        `New user registered: ${email}`,
        organization.id,
        user.id,
        req?.ip,
        req?.get('user-agent'),
        { email, role: user.role }
      );

      this.logger.log(`User registered successfully: ${email}`);

      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto, req) {
    const { email, password } = loginDto;

    try {
      // Validate input
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      // Find user
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { email },
        });
      } catch (dbError) {
        console.error('Database connection failed during login, using mock user:', dbError);
        // Use mock user when database is not available
        if (email === 'admin@tracker.local' && password === 'Demo@123456') {
          const mockUser = {
            id: 'mock-admin-1',
            email: 'admin@tracker.local',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN',
            organizationId: 'mock-org-1',
            avatar: null,
            status: 'ACTIVE',
            password: await argon2.hash('Demo@123456'),
            failedLoginAttempts: 0,
            lockedUntil: null,
          };
          
          // Generate JWT tokens
          const accessToken = this.jwtService.sign({
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            organizationId: mockUser.organizationId,
            sessionId: 'mock-session-1',
          }, {
            expiresIn: '15m',
          });

          const refreshTokenString = uuidv4();
          
          this.logger.log(`Mock user logged in successfully: ${email}`);
          
          return {
            accessToken,
            refreshToken: refreshTokenString,
            user: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
              role: mockUser.role,
              organizationId: mockUser.organizationId,
              avatar: mockUser.avatar,
              status: mockUser.status,
            },
          };
        } else {
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      if (!user) {
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.WARNING,
          `Login attempt with non-existent email: ${email}`,
          'unknown',
          undefined,
          req?.ip,
          req?.get('user-agent'),
          { email, success: false, reason: 'User not found' }
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.WARNING,
          `Login attempt with inactive account: ${email}`,
          user.organizationId,
          user.id,
          req?.ip,
          req?.get('user-agent'),
          { email, status: user.status, success: false, reason: 'Account inactive' }
        );
        throw new UnauthorizedException('Account is not active');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.ERROR,
          `Login attempt on locked account: ${email}`,
          user.organizationId,
          user.id,
          req?.ip,
          req?.get('user-agent'),
          { email, failedAttempts: user.failedLoginAttempts, lockedUntil: user.lockedUntil }
        );
        throw new UnauthorizedException(`Account is locked. Try again in ${remainingTime} minutes.`);
      }

      // Verify password using Argon2
      const isPasswordValid = await argon2.verify(user.password, password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        const failedAttempts = user.failedLoginAttempts + 1;
        const shouldLock = failedAttempts >= 5;
        const lockDuration = shouldLock ? 15 * 60 * 1000 : 0; // 15 minutes

        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedAttempts,
              lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null,
            },
          });
        } catch (updateError) {
          console.error('Failed to update user login attempts:', updateError);
        }

        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.ERROR,
          `Failed login attempt: ${email}`,
          user.organizationId,
          user.id,
          req?.ip,
          req?.get('user-agent'),
          { 
            email, 
            success: false, 
            reason: 'Invalid password',
            failedAttempts,
            accountLocked: shouldLock
          }
        );

        throw new UnauthorizedException('Invalid credentials');
      }

      // Reset failed login attempts on successful login
      try {
        // Check if 2FA is enabled - if so, return temp token for 2FA verification
        if (user.mfaEnabled && user.mfaSecret) {
          // Generate temporary token for 2FA verification
          const tempToken = this.jwtService.sign({
            userId: user.id,
            pending2FA: true,
          }, { expiresIn: '5m' });

          await this.createAuditLog(
            AuditAction.AUTH_LOGIN,
            AuditSeverity.INFO,
            `Login requires 2FA for user: ${user.email}`,
            user.organizationId,
            user.id,
            req?.ip,
            req?.get('user-agent'),
            { requires2FA: true },
          );

          return {
            requires2FA: true,
            tempToken,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              mfaEnabled: true,
            },
          };
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: req?.ip,
            lastLoginDevice: req?.get('user-agent'),
          },
        });

        // Create session
        const session = await this.prisma.session.create({
          data: {
            userId: user.id,
            ipAddress: req?.ip,
            userAgent: req?.get('user-agent'),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        // Generate JWT tokens with proper expiration
        const accessToken = this.jwtService.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          sessionId: session.id,
        }, {
          expiresIn: '15m',
        });

        const refreshTokenString = uuidv4();
        const hashedRefreshToken = await argon2.hash(refreshTokenString);

        // Revoke all existing refresh tokens for this user
        await this.prisma.refreshToken.updateMany({
          where: { 
            userId: user.id,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });

        // Create new refresh token
        await this.prisma.refreshToken.create({
          data: {
            token: hashedRefreshToken,
            userId: user.id,
            sessionId: session.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        // Create audit log
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN,
          AuditSeverity.INFO,
          `Successful login: ${email}`,
          user.organizationId,
          user.id,
          req?.ip,
          req?.get('user-agent'),
          { 
            sessionId: session.id,
            userAgent: req?.get('user-agent')
          }
        );

        this.logger.log(`User logged in successfully: ${email}`);

        return {
          accessToken,
          refreshToken: refreshTokenString,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            avatar: user.avatar,
            status: user.status,
          },
        };
      } catch (dbError) {
        console.error('Database operations failed during login, returning basic auth:', dbError);
        // Fallback: generate tokens without database persistence
        const accessToken = this.jwtService.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          sessionId: 'fallback-session',
        }, {
          expiresIn: '15m',
        });

        const refreshTokenString = uuidv4();
        
        return {
          accessToken,
          refreshToken: refreshTokenString,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            avatar: user.avatar,
            status: user.status,
          },
        };
      }
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, req) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      // Find valid refresh token
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
        include: {
          user: true,
          session: true,
        },
      });

      let validToken = null;
      let userId: string;

      for (const token of storedTokens) {
        const isValid = await argon2.verify(token.token, refreshToken);
        if (isValid) {
          validToken = token;
          userId = token.userId;
          break;
        }
      }

      if (!validToken) {
        // Log security event
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.ERROR,
          'Invalid refresh token attempt',
          'unknown',
          undefined,
          req?.ip,
          req?.get('user-agent'),
          { success: false, reason: 'Invalid refresh token' }
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is still active
      if (validToken.user.status !== 'ACTIVE') {
        await this.createAuditLog(
          AuditAction.AUTH_LOGIN_FAILED,
          AuditSeverity.WARNING,
          'Refresh token attempt with inactive user',
          validToken.user.organizationId,
          validToken.user.id,
          req?.ip,
          req?.get('user-agent'),
          { status: validToken.user.status, success: false }
        );
        throw new UnauthorizedException('User account is not active');
      }

      // Revoke old token
      await this.prisma.refreshToken.update({
        where: { id: validToken.id },
        data: { revokedAt: new Date() },
      });

      // Update session activity
      if (validToken.sessionId) {
        await this.prisma.session.update({
          where: { id: validToken.sessionId },
          data: { lastActivityAt: new Date() },
        });
      }

      // Generate new access token
      const accessToken = this.jwtService.sign({
        id: validToken.user.id,
        email: validToken.user.email,
        role: validToken.user.role,
        organizationId: validToken.user.organizationId,
        sessionId: validToken.sessionId,
      }, {
        expiresIn: '15m',
      });

      const newRefreshTokenString = uuidv4();
      const hashedNewRefreshToken = await argon2.hash(newRefreshTokenString);

      // Create new refresh token
      await this.prisma.refreshToken.create({
        data: {
          token: hashedNewRefreshToken,
          userId: validToken.user.id,
          sessionId: validToken.sessionId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create audit log
      await this.createAuditLog(
        AuditAction.AUTH_LOGIN,
        AuditSeverity.INFO,
        'Token refreshed successfully',
        validToken.user.organizationId,
        validToken.user.id,
        req?.ip,
        req?.get('user-agent'),
        { sessionId: validToken.sessionId }
      );

      this.logger.log(`Token refreshed for user: ${validToken.user.email}`);

      return {
        accessToken,
        refreshToken: newRefreshTokenString,
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async logout(userId: string, req) {
    try {
      // Get user details
      const user = await this.usersService.findById(userId);

      // Revoke all refresh tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { 
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      // Update sessions to mark as logged out
      await this.prisma.session.updateMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() },
        },
        data: { 
          lastActivityAt: new Date(),
        },
      });

      // Create audit log
      await this.createAuditLog(
        AuditAction.AUTH_LOGOUT,
        AuditSeverity.INFO,
        `User logged out: ${user.email}`,
        user.organizationId,
        userId,
        req?.ip,
        req?.get('user-agent'),
        {}
      );

      this.logger.log(`User logged out: ${user.email}`);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // For security, don't reveal if email exists or not
        this.logger.log(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      // Generate a reset token (in a real app, this would be a secure token with expiry)
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database (you'd need to add this field to the user model)
      // For now, we'll just log it (in production, you'd send an email)
      this.logger.log(`Password reset token generated for user: ${user.email}, token: ${resetToken}`);

      // Create audit log
      await this.createAuditLog(
        AuditAction.AUTH_PASSWORD_CHANGED,
        AuditSeverity.INFO,
        `Password reset requested: ${email}`,
        user.organizationId,
        user.id,
        'system',
        'system',
        { resetToken, expiry: resetTokenExpiry }
      );

      // In a real implementation, you would send an email here
      // For demo purposes, we'll just return success
      return { 
        message: 'If an account with this email exists, a password reset link has been sent.',
        // For demo: include the reset token (remove in production)
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      };
    } catch (error) {
      this.logger.error('Forgot password failed:', error);
      throw error;
    }
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findById(userId);
  }

  // 2FA Methods
  async setup2FA(userId: string, req: any) {
    try {
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });
      } catch (dbError) {
        console.error('Database connection failed during 2FA setup, using mock user:', dbError);
        // Use mock user when database is not available
        if (userId === 'mock-admin-1') {
          const mockUser = {
            id: 'mock-admin-1',
            email: 'admin@tracker.local',
            firstName: 'Admin',
            lastName: 'User',
            mfaEnabled: false,
            organization: { id: 'mock-org-1', name: 'Mock Organization' }
          };
          
          // Generate TOTP secret
          const secret = speakeasy.generateSecret({
            name: `Tracker:${mockUser.email}`,
            length: 32,
          });

          // Generate backup codes
          const backupCodes = Array.from({ length: 10 }, () => 
            Math.random().toString(36).substring(2, 8).toUpperCase()
          );

          // Store in mock state
          this.mock2FAState.set(userId, {
            mfaEnabled: false,
            mfaSecret: secret.base32,
            backupCodes: backupCodes
          });

          // Generate QR code
          const otpAuthUrl = secret.otpauth_url;
          const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

          this.logger.log(`Mock 2FA setup initiated for user: ${mockUser.email}`);

          return {
            qrCodeUrl,
            secret: secret.base32,
            backupCodes,
          };
        } else {
          throw new UnauthorizedException('User not found');
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.mfaEnabled) {
        throw new BadRequestException('2FA is already enabled for this account');
      }

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Tracker:${user.email}`,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // Hash backup codes for storage
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => argon2.hash(code))
      );

      // Store secret temporarily (not enabled until verified)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret.base32,
          backupCodes: hashedBackupCodes,
        },
      });

      // Generate QR code
      const otpAuthUrl = secret.otpauth_url;
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

      this.logger.log(`2FA setup initiated for user: ${user.email}`);

      return {
        qrCodeUrl,
        secret: secret.base32,
        backupCodes,
      };
    } catch (error) {
      this.logger.error('2FA setup failed:', error);
      throw error;
    }
  }

  async verify2FASetup(userId: string, code: string, req: any) {
    try {
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
      } catch (dbError) {
        console.error('Database connection failed during 2FA verification, using mock user:', dbError);
        // Use mock user when database is not available
        if (userId === 'mock-admin-1') {
          // For demo purposes, accept any 6-digit code for mock user
          if (code.length === 6 && /^\d{6}$/.test(code)) {
            // Update mock 2FA state
            const currentState = this.mock2FAState.get(userId);
            if (currentState) {
              this.mock2FAState.set(userId, {
                ...currentState,
                mfaEnabled: true
              });
            }
            this.logger.log(`Mock 2FA verification successful for user: admin@tracker.local`);
            return { message: 'Two-factor authentication enabled successfully' };
          } else {
            throw new BadRequestException('Invalid verification code');
          }
        } else {
          throw new UnauthorizedException('User not found');
        }
      }

      if (!user || !user.mfaSecret) {
        throw new BadRequestException('2FA setup not initiated');
      }

      if (user.mfaEnabled) {
        throw new BadRequestException('2FA is already enabled');
      }

      // Verify TOTP code
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2, // Allow 2 time steps of tolerance
      });

      if (!isValid) {
        await this.createAuditLog(
          AuditAction.AUTH_MFA_ENABLED,
          AuditSeverity.WARNING,
          `Failed 2FA setup verification for user: ${user.email}`,
          user.organizationId,
          userId,
          req?.ip,
          req?.get('user-agent'),
          { success: false },
        );
        throw new BadRequestException('Invalid verification code');
      }

      // Enable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      await this.createAuditLog(
        AuditAction.AUTH_MFA_ENABLED,
        AuditSeverity.INFO,
        `2FA enabled for user: ${user.email}`,
        user.organizationId,
        userId,
        req?.ip,
        req?.get('user-agent'),
        { success: true },
      );

      this.logger.log(`2FA enabled for user: ${user.email}`);

      return { message: 'Two-factor authentication enabled successfully' };
    } catch (error) {
      this.logger.error('2FA verification failed:', error);
      throw error;
    }
  }

  async verify2FALogin(userId: string, code: string, tempToken: string, req: any) {
    try {
      // Verify temp token first
      let payload;
      try {
        payload = this.jwtService.verify(tempToken);
      } catch {
        throw new UnauthorizedException('Invalid or expired session');
      }

      if (payload.userId !== userId || !payload.pending2FA) {
        throw new UnauthorizedException('Invalid session');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new BadRequestException('2FA not enabled');
      }

      // Check if code is a backup code
      let isBackupCode = false;
      if (code.length === 6 && user.backupCodes) {
        for (const hashedCode of user.backupCodes) {
          if (await argon2.verify(hashedCode, code)) {
            isBackupCode = true;
            // Remove used backup code
            await this.prisma.user.update({
              where: { id: userId },
              data: {
                backupCodes: {
                  set: user.backupCodes.filter(c => c !== hashedCode),
                },
              },
            });
            break;
          }
        }
      }

      // If not a backup code, verify TOTP
      if (!isBackupCode) {
        const isValid = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token: code,
          window: 2,
        });

        if (!isValid) {
          await this.createAuditLog(
            AuditAction.AUTH_LOGIN_FAILED,
            AuditSeverity.ERROR,
            `Failed 2FA verification for user: ${user.email}`,
            user.organizationId,
            userId,
            req?.ip,
            req?.get('user-agent'),
            { reason: 'Invalid 2FA code' },
          );
          throw new UnauthorizedException('Invalid verification code');
        }
      }

      // Complete login
      const session = await this.prisma.session.create({
        data: {
          userId: user.id,
          ipAddress: req?.ip,
          userAgent: req?.get('user-agent'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const accessToken = this.jwtService.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        sessionId: session.id,
      }, { expiresIn: '15m' });

      const refreshTokenString = uuidv4();
      const hashedRefreshToken = await argon2.hash(refreshTokenString);

      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          userId: user.id,
          sessionId: session.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: req?.ip,
          lastLoginDevice: req?.get('user-agent'),
        },
      });

      await this.createAuditLog(
        AuditAction.AUTH_LOGIN,
        AuditSeverity.INFO,
        `Successful login with 2FA for user: ${user.email}`,
        user.organizationId,
        userId,
        req?.ip,
        req?.get('user-agent'),
        { sessionId: session.id, usedBackupCode: isBackupCode },
      );

      return {
        accessToken,
        refreshToken: refreshTokenString,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          avatar: user.avatar,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
        },
      };
    } catch (error) {
      this.logger.error('2FA login verification failed:', error);
      throw error;
    }
  }

  async disable2FA(userId: string, code: string, req: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new BadRequestException('2FA is not enabled');
      }

      // Verify TOTP code
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (!isValid) {
        await this.createAuditLog(
          AuditAction.AUTH_MFA_DISABLED,
          AuditSeverity.WARNING,
          `Failed 2FA disable attempt for user: ${user.email}`,
          user.organizationId,
          userId,
          req?.ip,
          req?.get('user-agent'),
          { success: false, reason: 'Invalid code' },
        );
        throw new BadRequestException('Invalid verification code');
      }

      // Disable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          backupCodes: [],
        },
      });

      // Revoke all sessions and tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.prisma.session.updateMany({
        where: { userId, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date() },
      });

      await this.createAuditLog(
        AuditAction.AUTH_MFA_DISABLED,
        AuditSeverity.INFO,
        `2FA disabled for user: ${user.email}`,
        user.organizationId,
        userId,
        req?.ip,
        req?.get('user-agent'),
        { success: true },
      );

      this.logger.log(`2FA disabled for user: ${user.email}`);

      return { message: 'Two-factor authentication disabled successfully' };
    } catch (error) {
      this.logger.error('2FA disable failed:', error);
      throw error;
    }
  }

  async get2FAStatus(userId: string) {
    try {
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            mfaEnabled: true,
            backupCodes: true,
          },
        });
      } catch (dbError) {
        console.error('Database connection failed during 2FA status check, using mock user:', dbError);
        // Use mock user when database is not available
        if (userId === 'mock-admin-1') {
          const mockState = this.mock2FAState.get(userId);
          return {
            mfaEnabled: mockState?.mfaEnabled || false,
            backupCodesRemaining: mockState?.backupCodes?.length || 0,
          };
        } else {
          throw new UnauthorizedException('User not found');
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        mfaEnabled: user.mfaEnabled,
        backupCodesRemaining: user.backupCodes?.length || 0,
      };
    } catch (error) {
      this.logger.error('Get 2FA status failed:', error);
      throw error;
    }
  }

  async regenerateBackupCodes(userId: string, code: string, req: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new BadRequestException('2FA is not enabled');
      }

      // Verify TOTP code
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (!isValid) {
        throw new BadRequestException('Invalid verification code');
      }

      // Generate new backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const hashedBackupCodes = await Promise.all(
        backupCodes.map(c => argon2.hash(c))
      );

      await this.prisma.user.update({
        where: { id: userId },
        data: { backupCodes: hashedBackupCodes },
      });

      this.logger.log(`Backup codes regenerated for user: ${user.email}`);

      return { backupCodes };
    } catch (error) {
      this.logger.error('Backup codes regeneration failed:', error);
      throw error;
    }
  }
}
