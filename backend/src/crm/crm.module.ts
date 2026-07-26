import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CRMController } from './crm.controller';
import { CRMService } from './crm.service';
import { GroqService } from './groq.provider';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
  ],
  controllers: [CRMController],
  providers: [CRMService, GroqService, PrismaService],
  exports: [CRMService, GroqService, PrismaService, BullModule],
})
export class CRMModule {}

