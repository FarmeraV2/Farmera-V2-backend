import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import { AuditEventID } from "../enums/audit_event_id";

@Entity()
export class AuditEvent {
    @PrimaryColumn({ type: 'varchar', length: 6 })
    id: AuditEventID;

    @Column({ unique: true })
    name: string;

    @Column()
    description: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;
}