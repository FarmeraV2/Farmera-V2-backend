import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BlockchainSyncState {
    @PrimaryColumn()
    key: string;

    @Column('bigint')
    latest_block_processed: bigint;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;
}
