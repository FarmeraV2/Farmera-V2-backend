import * as fs from "fs";
import { join } from "path";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupTriggers1769708443278 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "up");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "down");
    }

    private async runSqlFiles(queryRunner: QueryRunner, dir: string) {
        const folderPath = join(__dirname, "/../database/triggers/1769708443278-SetupTriggers", dir);
        const files = fs.readdirSync(folderPath).sort();

        for (const file of files) {
            const sql = fs.readFileSync(join(folderPath, file), "utf8");
            await queryRunner.query(sql);
        }
    }

}
