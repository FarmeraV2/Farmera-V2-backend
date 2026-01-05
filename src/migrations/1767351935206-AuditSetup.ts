import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditSetup1767351935206 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO audit_event (id, name, description)
            VALUES 
                ('EKYC01', 'EKYC_IDR', 'Identity document verification (National ID): validate document authenticity, structure, and detect forgery signs'),
                ('EKYC02', 'EKYC_LIVENESS', 'Biometric liveness detection: identify spoofing attempts such as photo, replayed video, or deepfake attacks'),
                ('EKYC03', 'EKYC_FACE_MATCH', 'Facial comparison between identity document photo and user selfie/video to verify identity consistency'),
            
                ('FARM01', 'FARM_CREATED', 'Farm has been created in the system'),
                ('FARM02', 'FARM_VERIFIED', 'Farm information has been verified'),
                ('FARM03', 'FARM_APPROVED', 'Farm has been approved and is ready for operations')

            ON CONFLICT (name) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE TABLE audit_event RESTART IDENTITY CASCADE");
    }
}
