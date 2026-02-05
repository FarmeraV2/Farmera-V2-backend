import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditTransparencyActionsSetup1770276217573 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO audit_event (id, name, description)
            VALUES 
                ('FTS001', 'CRON_FARM_TRANSPARENCY_START', 'Cron job started calculating transparency scores for all farms'),
                ('FTS002', 'CRON_FARM_TRANSPARENCY_SUCCESS', 'Cron job finished calculating transparency scores for all farms successfully'),
                ('FTS003', 'CRON_FARM_TRANSPARENCY_FAILED', 'Cron job failed while calculating transparency scores for farm'),
                ('FTS004', 'CRON_FARM_TRANSPARENCY_ERROR', 'Cron job calculating transparency scores error')

            ON CONFLICT (name) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM audit_event
            WHERE id IN (
                'FTS001',
                'FTS002',
                'FTS003',
                'FTS004'
            )
        `);
    }

}
