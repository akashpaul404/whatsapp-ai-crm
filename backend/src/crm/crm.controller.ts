import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { CRMService } from './crm.service';

@Controller('crm')
export class CRMController {
  private redisClient: Redis;

  constructor(
    @Inject(CRMService) private readonly crmService: CRMService,
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    this.redisClient.on('error', () => {});
  }

  @Get('leads')
  async getLeads() {
    return this.crmService.getAllLeads();
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.crmService.getAuditLogs();
  }

  @Get('knowledge-base')
  async getKnowledgeBase() {
    const content = await this.crmService.getKnowledgeBase();
    return { content };
  }

  @Post('knowledge-base')
  async updateKnowledgeBase(@Body('content') content: string) {
    return this.crmService.updateKnowledgeBase(content);
  }

  @Get('chat-history/:phone')
  async getChatHistory(@Param('phone') phone: string) {
    return this.crmService.getChatHistory(phone);
  }

  @Post('clear-chat')
  async clearChatHistory(@Body('phone') phone: string) {
    return this.crmService.clearChatHistory(phone);
  }

  @Post('revert')
  async revertState(@Body('actionId') actionId: string) {
    return this.crmService.revertState(actionId);
  }

  @Post('webhook-ingest')
  async enqueueWebhookPayload(
    @Body() payload: { phone: string; message: string; sender: string },
  ) {
    // Fix 4: Dedup via Redis SETNX before queueing
    // In production this key would be Meta's wamid. Here we use a synthetic hash
    // over (phone + message + 30s time bucket) as a stand-in for simulated webhooks.
    const bucket = Math.floor(Date.now() / 30000); // 30-second dedup window
    const msgId = createHash('sha256')
      .update(`${payload.phone}:${payload.message}:${bucket}`)
      .digest('hex')
      .slice(0, 16);

    try {
      if (this.redisClient.status === 'ready') {
        const isNew = await this.redisClient.set(
          `crm:dedup:${msgId}`,
          '1',
          'EX',
          60,
          'NX',
        );
        if (!isNew) {
          return {
            status: 'duplicate',
            message: 'Message already queued within the dedup window (30s). Ignoring retry.',
            msgId,
          };
        }
      }
    } catch (_) {
      // If Redis is unavailable, proceed without dedup rather than dropping messages
    }

    const job = await this.webhookQueue.add('process-webhook', {
      ...payload,
      msgId,
      timestamp: Date.now(),
    });

    return {
      status: 'queued',
      message: 'Job pushed to BullMQ queue successfully',
      jobId: job.id,
      msgId,
    };
  }
}