import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: any) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async findAll(organizationId: string, skip = 0, take = 50) {
    const logs = await this.prisma.auditLog.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    const total = await this.prisma.auditLog.count({
      where: { organizationId },
    });

    return { logs, total };
  }

  async findByUser(userId: string, organizationId: string, skip = 0, take = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId, organizationId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
