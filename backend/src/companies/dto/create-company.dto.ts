import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  @IsOptional()
  certificateName?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @IsOptional()
  certificationIds?: string[];

  @IsString()
  @IsOptional()
  logo?: string; // Base64 encoded image or file URL
}