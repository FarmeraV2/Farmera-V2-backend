import { ActorType } from "../enums/actor-type";
import { AuditResult } from "../enums/audit-result";
import { AuditEventID } from "../enums/audit_event_id";

export class AuditDto {
    actor_type: ActorType;
    audit_event_id: AuditEventID;
    actor_id?: number;
    result: AuditResult;
    metadata?: Record<string, any>;
}