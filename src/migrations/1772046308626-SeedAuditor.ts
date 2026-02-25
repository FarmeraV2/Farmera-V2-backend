import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAuditor1772046308626 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "user" (uuid,email,phone,first_name,last_name,hashed_pwd,gender,role,status,points,created_at,updated_at)
            VALUES
                (gen_random_uuid(), 'auditor1@farmera.com', '0900000006', 'Auditor 1', 'Auditor', '$2b$10$S9gWoU4f/zXLt2MySnMNJeaiuTIXSzBT6Sj1fJ5mPdHvs6gPFGKwW', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'auditor2@farmera.com', '0900000007', 'Auditor 2', 'Auditor', '$2b$10$S9gWoU4f/zXLt2MySnMNJeaiuTIXSzBT6Sj1fJ5mPdHvs6gPFGKwW', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'auditor3@farmera.com', '0900000008', 'Auditor 3', 'Auditor', '$2b$10$S9gWoU4f/zXLt2MySnMNJeaiuTIXSzBT6Sj1fJ5mPdHvs6gPFGKwW', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW());
 
            INSERT INTO auditor_profiles (user_id, wallet_address, is_active, total_verifications, correct_verifications, created, updated)
            SELECT id, wallet, true, 0, 0, NOW(), NOW()
            FROM (
                VALUES
                    ('auditor1@farmera.com', '0x7036A25578d030f719c0503a4Ccab1609E425B34'),
                    ('auditor2@farmera.com', '0xEfCD49B685f0bA16038f14E5726B830C6d24Ceb3'),
                    ('auditor3@farmera.com', '0x8663FebFf6035eFD6a31Da58186210B40D92D8B2')
            ) AS data(email, wallet)
            JOIN "user" u ON u.email = data.email;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM auditor_profiles
            WHERE user_id IN (
                SELECT id FROM "user"
                WHERE email IN (
                    'auditor1@farmera.com',
                    'auditor2@farmera.com',
                    'auditor3@farmera.com'
                )
            );

            DELETE FROM "user"
            WHERE email IN (
                'auditor1@farmera.com',
                'auditor2@farmera.com',
                'auditor3@farmera.com'
            );
        `);
    }

}
