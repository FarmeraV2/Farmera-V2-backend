import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSteps1759332332035 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO step (id, name, description, for_crop_type, "order", is_optional, repeated, min_logs, type)
            VALUES 
                (1, 'Chuẩn bị hạt', 'Chọn hạt giống, ngâm/ủ trước khi gieo', 'SHORT_TERM', 10, false, false, 1, 'PREPARE'),
                (2, 'Chuẩn bị đất', 'Làm đất, xử lý cỏ, lên luống', 'SHORT_TERM', 20, false, false, 1, 'PREPARE'),
                (3, 'Gieo hạt', 'Gieo hạt giống theo khoảng cách hợp lý', 'SHORT_TERM', 30, false, false, 1, 'PLANTING'),
                (4, 'Chăm sóc', 'Chăm sóc định kỳ', 'SHORT_TERM', 40, false, false, 4, 'CARE'),
                (5, 'Thu hoạch', 'Thu hoạch khi cây đạt độ chín', 'SHORT_TERM', 50, false, false, 1, 'HARVEST'),
                (6, 'Đóng gói', 'Đóng gói, chuẩn bị vận chuyển', 'SHORT_TERM', 60, false, false, 1, 'POST_HARVEST');
        `);

        await queryRunner.query(`
            INSERT INTO step (id, name, description, for_crop_type, "order", is_optional, repeated, min_logs, type, parent_id)
            VALUES
                (7, 'Tưới nước', 'Tưới nước hằng ngày theo nhu cầu cây', 'SHORT_TERM', 41, false, true, 1, 'CARE', 4),
                (8, 'Bón phân', 'Bón phân định kỳ cho cây', 'SHORT_TERM', 42, false, true, 2, 'CARE', 4),
                (9, 'Làm cỏ', 'Nhổ cỏ hoặc làm sạch luống', 'SHORT_TERM', 43, true, true, 1, 'CARE', 4),
                (10, 'Phòng trừ sâu bệnh', 'Theo dõi và xử lý sâu bệnh', 'SHORT_TERM', 44, true, true, 1, 'CARE', 4);
        `);

        await queryRunner.query(`
            INSERT INTO step (id, name, description, for_crop_type, "order", is_optional, repeated, min_logs, type)
            VALUES 
                (11, 'Chuẩn bị hạt', 'Chọn hạt giống, ngâm/ủ trước khi trồng', 'LONG_TERM', 10, true, false, 1, 'PREPARE'),
                (12, 'Chuẩn bị đất', 'Làm đất, xử lý cỏ, bón lót trước khi trồng', 'LONG_TERM', 20, true, false, 1, 'PREPARE'),
                (13, 'Trồng cây', 'Trồng cây con hoặc cây giống vào luống', 'LONG_TERM', 30, true, false, 1, 'PLANTING'),
                (14, 'Chăm sóc định kỳ', 'Chăm sóc định kỳ', 'LONG_TERM', 40, false, true, 1, 'CARE'),
                (15, 'Thu hoạch', 'Thu hoạch sản phẩm khi cây đạt độ chín', 'LONG_TERM', 50, false, true, 1, 'HARVEST'),
                (16, 'Đóng gói & xuất bán', 'Rửa, phân loại, đóng gói sản phẩm', 'LONG_TERM', 60, false, true, 1, 'POST_HARVEST');
        `);

        await queryRunner.query(`
            INSERT INTO step (id, name, description, for_crop_type, "order", is_optional, repeated, min_logs, type, parent_id)
            VALUES
                (17, 'Tưới nước', 'Tưới nước định kỳ theo nhu cầu cây', 'LONG_TERM', 131, false, true, 1, 'CARE', 13),
                (18, 'Bón phân', 'Bón phân theo giai đoạn sinh trưởng', 'LONG_TERM', 132, false, true, 1, 'CARE', 13),
                (19, 'Cắt tỉa & tạo tán', 'Cắt nhánh, tạo tán, giữ dáng cây', 'LONG_TERM', 133, true, true, 1, 'CARE', 13),
                (20, 'Phòng trừ sâu bệnh', 'Theo dõi và xử lý sâu bệnh', 'LONG_TERM', 134, true, true, 1, 'CARE', 13),
                (21, 'Kiểm tra đất & dinh dưỡng', 'Đo pH, phân tích đất', 'LONG_TERM', 135, true, true, 1, 'CARE', 13);    
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE TABLE step RESTART IDENTITY CASCADE");
    }
}
