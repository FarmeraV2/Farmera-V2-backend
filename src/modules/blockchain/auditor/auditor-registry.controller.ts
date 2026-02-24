import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuditorRegistryService } from './auditor-registry.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Address } from 'web3';
import { BlockRequest } from '../dtos/block-request.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { IdentifierDto } from '../dtos/identifier.dto';

@Controller('auditor-registry')
export class AuditorRegistryController {
    constructor(private readonly auditorRegistryService: AuditorRegistryService) { }

    @Public()
    @Get("auditor")
    async getAuditor(@Query() query: { address: Address }) {
        return await this.auditorRegistryService.getAuditor(query.address);
    }

    @Public()
    @Get("verification")
    async getVerifications(@Query() query: IdentifierDto) {
        return await this.auditorRegistryService.getVerifications(query.identifier, query.id);
    }

    @Public()
    @Get("verification/deadline")
    async getVerificationDeadline(@Query() query: IdentifierDto) {
        return await this.auditorRegistryService.getVerificationDeadline(query.identifier, query.id);
    }

    @Public()
    @Get("verification/finalize")
    async getVerificationsFinalize(@Query() query: IdentifierDto) {
        return await this.auditorRegistryService.getVerificationsFinalize(query.identifier, query.id);
    }

    @Public()
    @Get("block-number")
    async getCurrentBlockNumber() {
        return await this.auditorRegistryService.getCurrentBlockNumber();
    }

    @Public()
    @Get("verification/recent-finalized-event")
    async getRecentVerificationFinalizedEvents(@Query() query: BlockRequest) {
        return await this.auditorRegistryService.getRecentVerificationFinalizedEvents(query.from, query.to);
    }

    @Public()
    @Get("verification/recent-request-event")
    async getRecentVerificationRequestEvents(@Query() query: BlockRequest) {
        return await this.auditorRegistryService.getRecentVerificationRequestEvents(query.from, query.to);
    }

    @Roles([UserRole.ADMIN])
    @Post("finalize-expired")
    async finalizeExpired(@Body() body: IdentifierDto) {
        return await this.auditorRegistryService.finalizeExpired(body.identifier, body.id);
    }

    @Public()
    @Get("auditor-number")
    async getMinAuditor() {
        return await this.auditorRegistryService.getMinAuditors();
    }
}
