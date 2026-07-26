import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './queue/queue.module';
import { CRMModule } from './crm/crm.module';
import { WebsocketModule } from './websocket/websocket.module';
import Redis from 'ioredis';

const createRedisClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('error', (err) => {
    // Suppress unhandled ECONNRESET error traces from idle Upstash TLS socket closures
  });

  return client;
};

@Module({
  imports: [
    BullModule.forRoot({
      connection: createRedisClient(),
    }),
    QueueModule,
    CRMModule,
    WebsocketModule,
  ],
})
export class AppModule {}