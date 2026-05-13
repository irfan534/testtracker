import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ExpiryCheckerService {
  private readonly logger = new Logger(ExpiryCheckerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiries() {
    this.logger.log('Running daily certification expiry check...');
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update to EXPIRED
    const expiredResult = await this.prisma.certification.updateMany({
      where: {
        expiryDate: { lt: now },
        status: { not: 'EXPIRED' },
        deletedAt: null,
      },
      data: { status: 'EXPIRED' },
    });

    if (expiredResult.count > 0) {
      this.logger.log(`Marked ${expiredResult.count} certifications as EXPIRED`);
    }

    // Update to EXPIRING_SOON
    const expiringSoonResult = await this.prisma.certification.updateMany({
      where: {
        expiryDate: { gte: now, lte: thirtyDaysLater },
        status: 'ACTIVE',
        deletedAt: null,
      },
      data: { status: 'EXPIRING_SOON' },
    });

    if (expiringSoonResult.count > 0) {
      this.logger.log(`Marked ${expiringSoonResult.count} certifications as EXPIRING_SOON`);
    }
  }
}
