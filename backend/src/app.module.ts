import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './queue/queue.module';
import { CRMModule } from './crm/crm.module';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.forRoot({
      connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
      }),
    }),
    QueueModule,
    CRMModule,
  ],
})
export class AppModule {}