import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { CRMService } from '../crm/crm.service';
import { EventsGateway } from '../websocket/events.gateway';

@Processor('webhook-queue')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    @Inject(CRMService) private readonly crmService: CRMService,
    @Inject(EventsGateway) private readonly eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { sender, phone, message, msgId = job.id, timestamp = Date.now() } = job.data || {};

    this.logger.log(`[BullMQ Worker] Job ${job.id} | Phone: ${phone}`);

    this.eventsGateway.broadcastTrace({
      msgId,
      phone,
      step: 'QUEUED',
      status: 'ok',
      detail: `Job #${job.id} dequeued from BullMQ`,
    });

    if ((!sender && !phone) || !message) {
      this.eventsGateway.broadcastTrace({
        msgId,
        phone: phone ?? 'unknown',
        step: 'ERROR',
        status: 'fail',
        detail: 'Invalid payload structure — job dropped',
      });
      throw new Error('Invalid webhook payload structure');
    }

    this.eventsGateway.broadcastTrace({
      msgId,
      phone,
      step: 'LLM_CALLED',
      status: 'pending',
      detail: `Calling Groq LLM for message: "${message.slice(0, 60)}"`,
    });

    const result = await this.crmService.processIncomingMessage({
      sender,
      phone: phone || '+919876543210',
      message,
    });

    const intent = result.parsed?.intent ?? 'UNKNOWN';
    const confidence = result.parsed?.confidence ?? 0;

    if (result.actionLog === null && intent !== 'UNKNOWN') {
      // Confirmation staged — destructive intent pending YES
      this.eventsGateway.broadcastTrace({
        msgId,
        phone,
        step: 'CONFIRMATION_STAGED',
        status: 'pending',
        detail: `Intent: ${intent} (${confidence}) — awaiting YES confirmation`,
      });
    } else if (result.actionLog) {
      this.eventsGateway.broadcastTrace({
        msgId,
        phone,
        step: 'COMMITTED',
        status: 'ok',
        detail: `Intent: ${intent} (${confidence}) → Status: ${result.lead?.status}`,
      });
    } else {
      this.eventsGateway.broadcastTrace({
        msgId,
        phone,
        step: 'COMMITTED',
        status: 'ok',
        detail: `Intent: ${intent} — no state change`,
      });
    }

    if (result.lead) {
      this.eventsGateway.broadcastLeadUpdate(result.lead);
    }
    this.eventsGateway.broadcastChatUpdate(phone);

    return {
      status: 'PROCESSED',
      intent,
      payload: { sender, phone, message, timestamp },
    };
  }
}