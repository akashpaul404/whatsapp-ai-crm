import { Injectable } from '@nestjs/common';

@Injectable()
export class CRMService {
    async getAllLeads() {
        // Structural mock data. In Phase 3, this will call Prisma.
        return [
            { id: '1', name: 'Rahul Sharma', phone: '+919876543210', status: 'NEW', notes: 'Interested in 2BHK' },
            { id: '2', name: 'Priya Nair', phone: '+918765432109', status: 'HOT_PROSPECT', notes: 'Urgent Visa process' }
        ];
    }
}