import { Module } from '@nestjs/common';
import { CRMController } from './crm/crm.controller';
import { CRMService } from './crm/crm.service';
import { QueueProcessorService } from './queue/queue-processor.service';

@Module({
  imports: [],
  controllers: [CRMController],
  providers: [CRMService, QueueProcessorService],
})
export class AppModule {}