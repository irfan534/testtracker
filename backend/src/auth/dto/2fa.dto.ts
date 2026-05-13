import { IsString, IsNotEmpty, IsBoolean, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Setup2FADto {
  @ApiProperty({ description: 'User ID for setup (admin only)', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class Verify2FADto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiProperty({ description: 'Temporary token from initial login', required: false })
  @IsString()
  @IsOptional()
  tempToken?: string;

  @ApiProperty({ description: 'User ID for 2FA login verification', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class Disable2FADto {
  @ApiProperty({ description: '6-digit TOTP code to confirm disable', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class Verify2FAResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User data' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    avatar: string | null;
    status: string;
    mfaEnabled: boolean;
  };
}

export class Setup2FAResponseDto {
  @ApiProperty({ description: 'QR Code URL for authenticator app' })
  qrCodeUrl: string;

  @ApiProperty({ description: 'Manual entry secret key' })
  secret: string;

  @ApiProperty({ description: 'Backup codes for account recovery' })
  backupCodes: string[];
}
