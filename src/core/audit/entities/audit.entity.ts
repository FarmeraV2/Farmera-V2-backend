import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ActorType } from "../enums/actor-type";
import { AuditEvent } from "./audit-event.entity";
import { User } from "src/modules/user/entities/user.entity";
import { AuditEventID } from "../enums/audit_event_id";
import { AuditResult } from "../enums/audit-result";

@Entity()
export class Audit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: ActorType, enumName: 'audit_actor_type' })
    actor_type: ActorType;

    @ManyToOne(() => AuditEvent)
    @JoinColumn({ name: 'audit_event_id' })
    audit_event: AuditEvent;

    @Column({ type: 'varchar', length: 6 })
    audit_event_id: AuditEventID;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'actor_id' })
    actor?: User;

    @Column({ nullable: true })
    actor_id: number;

    @Column({ type: 'enum', enum: AuditResult, enumName: 'audit_result' })
    result: AuditResult;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;
}