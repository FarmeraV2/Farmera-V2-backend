import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApprovalAction } from '../enums/approval-action.enum';
import { Farm } from './farm.entity';

@Entity()
export class FarmApproval {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enumName: 'approval_action', enum: ApprovalAction })
    action: ApprovalAction;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column()
    admin_id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;

    @Column()
    farm_id: number;
}