import * as fs from "fs";
import { join } from "path";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedStep1770449847264 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "up");
        await queryRunner.query(`
            SELECT setval(
                pg_get_serial_sequence('step', 'id'),
                (SELECT MAX(id) FROM step)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "down");
    }

    private async runSqlFiles(queryRunner: QueryRunner, dir: string) {
        const folderPath = join(__dirname, "/../database/sql/1770449847264-SeedStep", dir);
        const files = fs.readdirSync(folderPath).sort();

        for (const file of files) {
            const sql = fs.readFileSync(join(folderPath, file), "utf8");
            await queryRunner.query(sql);
        }
    }

}
