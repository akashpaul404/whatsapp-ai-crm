import { Controller, Get } from '@nestjs/common';
import { CRMService } from './crm.service';

@Controller('crm')
export class CRMController {
    constructor(private readonly crmService: CRMService) { }

    @Get('leads')
    async getLeads() {
        return this.crmService.getAllLeads();
    }
}