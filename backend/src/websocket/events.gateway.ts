import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export type TraceStep =
  | 'DEDUP_CHECK'
  | 'QUEUED'
  | 'LLM_CALLED'
  | 'CONFIRMATION_STAGED'
  | 'COMMITTED'
  | 'CANCELLED'
  | 'ERROR';

export interface TraceEvent {
  msgId: string;
  phone: string;
  step: TraceStep;
  status: 'ok' | 'pending' | 'fail';
  detail: string;
  timestamp: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('📡 WebSocket Gateway Initialized on NestJS engine');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit a structured trace step event to the frontend.
   * Frontend renders these as discrete labelled steps in the Trace Panel.
   */
  broadcastTrace(event: Omit<TraceEvent, 'timestamp'>) {
    if (this.server) {
      const payload: TraceEvent = { ...event, timestamp: new Date().toISOString() };
      this.server.emit('telemetry_trace', payload);
      this.logger.log(`📡 [Trace] ${event.step} | ${event.status.toUpperCase()} | ${event.detail}`);
    }
  }

  broadcastLeadUpdate(leadData: any) {
    if (this.server) {
      this.server.emit('lead_updated', {
        timestamp: new Date().toISOString(),
        lead: leadData,
      });
    }
  }

  broadcastChatUpdate(phone: string) {
    if (this.server) {
      this.server.emit('chat_updated', {
        timestamp: new Date().toISOString(),
        phone,
      });
    }
  }

  // Keep backward compat for raw string logs (used in webhook.processor.ts)
  broadcastLog(logMessage: string) {
    if (this.server) {
      this.server.emit('telemetry_log', {
        timestamp: new Date().toISOString(),
        message: logMessage,
      });
    }
  }
}
