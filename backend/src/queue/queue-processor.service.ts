import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueProcessorService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private isRunning: boolean = true;

  onModuleInit() {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 1000, 5000),
      lazyConnect: true,
    });

    // Handle ioredis error events to prevent unhandled exception crashes
    this.redisClient.on('error', (err) => {
      // Suppress unhandled event logs when Redis server is offline
    });

    this.redisClient
      .connect()
      .then(() => {
        console.log('🚀 [NestJS Engine] Connected to Redis Broker.');
        this.pollQueue();
      })
      .catch((err) => {
        console.warn('⚠️ [NestJS Engine] Redis connection failed (is Redis running?):', err.message);
      });
  }

  private async pollQueue() {
    while (this.isRunning) {
      try {
        if (this.redisClient.status === 'ready') {
          const result = await this.redisClient.brpop('crm_messages', 0);
          if (result) {
            const [_, rawPayload] = result;
            const parsedData = JSON.parse(rawPayload);
            console.log(`📥 [NestJS Worker] Processed queue item from ${parsedData.phone}`);
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('❌ Queue worker error:', (error as any)?.message || error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  onModuleDestroy() {
    this.isRunning = false;
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }
}