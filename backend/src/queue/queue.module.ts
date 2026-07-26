import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';
import { CRMModule } from '../crm/crm.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
    CRMModule,
    WebsocketModule,
  ],
  providers: [WebhookProcessor],
  exports: [BullModule],
})
export class QueueModule {}