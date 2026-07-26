import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('webhook-queue')
export class WebhookProcessor extends WorkerHost {
    private readonly logger = new Logger(WebhookProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        const payloadData = job.data || {};
        const eventName = payloadData.event || 'WEBHOOK_RECEIVED';

        this.logger.log(`Processing webhook job: ${job.id} | Event: ${eventName}`);

        const { sender, phone, message, timestamp = Date.now() } = payloadData;

        // Structural check for incoming webhook content before passing to CRM layer
        if ((!sender && !phone) || !message) {
            throw new Error('Invalid webhook payload structure - Dropping Job');
        }

        // Return processed payload for downstream CRM parsing layer
        return {
            status: 'QUEUED_FOR_PARSING',
            payload: { sender: sender || 'Unknown Sender', phone, message, timestamp },
        };
    }
}