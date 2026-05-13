import { Module } from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { ExpiryCheckerService } from './cron/expiry-checker.service';

@Module({
  controllers: [CertificationsController],
  providers: [CertificationsService, ExpiryCheckerService],
})
export class CertificationsModule {}
