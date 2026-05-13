import { IsString, IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateCertificationDto {
  @IsString()
  name: string;

  @IsString()
  certificateId: string;

  @IsString()
  certificateType: string;

  @IsDate()
  issueDate: Date;

  @IsDate()
  expiryDate: Date;

  @IsNumber()
  validityDays: number;

  @IsString()
  issuingBody: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  renewalReminderDays?: number;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
