import { MigrationInterface, QueryRunner } from "typeorm";
import * as fs from "fs";
import { join } from "path";

export class SetupProcessTrigger1759396303600 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "up");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.runSqlFiles(queryRunner, "down");
    }

    private async runSqlFiles(queryRunner: QueryRunner, dir: string) {
        const folderPath = join(__dirname, "/../database/triggers/1759396303600-SetupProcessTrigger", dir);
        const files = fs.readdirSync(folderPath).sort();

        for (const file of files) {
            const sql = fs.readFileSync(join(folderPath, file), "utf8");
            await queryRunner.query(sql);
        }
    }

}
