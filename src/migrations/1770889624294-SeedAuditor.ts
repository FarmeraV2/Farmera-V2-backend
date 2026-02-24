import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAuditor1770889624294 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "user" (uuid,email,phone,first_name,last_name,hashed_pwd,gender,role,status,points,created_at,updated_at)
            VALUES
                (gen_random_uuid(), 'alex@farmera.com', '0900000001', 'Alex', 'Auditor', 'hashedpwd', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'bob@farmera.com', '0900000002', 'Bob', 'Auditor', 'hashedpwd', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'chloe@farmera.com', '0900000003', 'Chloe', 'Auditor', 'hashedpwd', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'doe@farmera.com', '0900000004', 'Doe', 'Auditor', 'hashedpwd', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW()),
                (gen_random_uuid(), 'jane@farmera.com', '0900000005', 'Jane', 'Auditor', 'hashedpwd', 'UNSPECIFIED', 'AUDITOR', 'ACTIVE', 0, NOW(), NOW());


            INSERT INTO auditor_profiles (user_id, wallet_address, is_active, total_verifications, correct_verifications, created, updated)
            SELECT id, wallet, true, 0, 0, NOW(), NOW()
            FROM (
                VALUES
                    ('alex@farmera.com', '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'),
                    ('bob@farmera.com', '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'),
                    ('chloe@farmera.com', '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'),
                    ('doe@farmera.com', '0x976EA74026E726554dB657fA54763abd0C3a0aa9'),
                    ('jane@farmera.com', '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc')
            ) AS data(email, wallet)
            JOIN "user" u ON u.email = data.email;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE TABLE auditor_profiles RESTART IDENTITY CASCADE");
    }

}
