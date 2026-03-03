import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSteps1772470358153 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE step
            SET min_day_duration = 1
            WHERE type = 'CARE' 
                AND min_day_duration IS NULL 
                AND step.id IN (
                    SELECT step.id
                    FROM step JOIN crop ON crop.id = step.crop_id
                    WHERE crop_type = 'SHORT_TERM'
                );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
