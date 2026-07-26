import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
  ],
  providers: [WebhookProcessor],
  exports: [BullModule],
})
export class QueueModule {}