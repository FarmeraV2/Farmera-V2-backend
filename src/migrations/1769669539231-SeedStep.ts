import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedStep1769669539231 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- =====================================================
            -- CROP ID = 1
            -- =====================================================
            INSERT INTO "step" (
                crop_id, name, description, "order",
                repeated, is_optional, min_logs,
                type, interval_date
            )
            VALUES (
                1,
                'Chuẩn bị đất & Dựng trụ',
                'Cày bừa, phơi ải, dựng trụ xi măng/giàn T. Bón lót phân chuồng ủ hoai.',
                1,
                false,
                false,
                1,
                'PREPARE',
                0
            ),
            (
                1,
                'Xuống giống (Trồng hom)',
                'Đặt hom giống sâu 2-5cm, cột cố định. Tủ gốc giữ ẩm ngay sau trồng.',
                2,
                false,
                false,
                1,
                'PLANTING',
                0
            ),
            (
                1,
                'Tưới nước & Giữ ẩm',
                'Tưới nhỏ giọt/phun mưa. Mùa khô tưới 3-5 ngày/lần. Đảm bảo độ ẩm đất.',
                3,
                true,
                false,
                0,
                'CARE',
                3
            ),
            (
                1,
                'Bón phân & Phòng trừ sâu bệnh',
                'Bón NPK nuôi cây/nuôi trái. Phun thuốc trị nấm/bọ trĩ khi cần.',
                4,
                true,
                false,
                0,
                'CARE',
                7
            ),
            (
                1,
                'Thu hoạch tại vườn',
                'Cắt trái khi vỏ đỏ đều, tai xanh cứng. Dùng kéo sắc.',
                5,
                true,
                false,
                1,
                'HARVEST',
                1
            ),
            (
                1,
                'Sơ chế & Đóng gói',
                'Rửa sạch, phân loại kích cỡ, đóng thùng và dán tem.',
                6,
                false,
                false,
                1,
                'POST_HARVEST',
                0
            );

            -- =====================================================
            -- CROP ID = 2
            -- =====================================================
            INSERT INTO "step" (
                crop_id, name, description, "order",
                repeated, is_optional, min_logs,
                type, interval_date
            )
            VALUES (
                2,
                'Tỉa cành & Vệ sinh vườn sau thu hoạch',
                'Cắt bỏ cành già, sâu bệnh. Dọn cỏ, quét vôi vết cắt.',
                1,
                false,
                false,
                1,
                'CARE',
                0
            ),
            (
                2,
                'Bón phân phục hồi & Kích đọt',
                'Bón hữu cơ + NPK đạm cao để kích thích ra đọt.',
                2,
                false,
                false,
                1,
                'CARE',
                7
            ),
            (
                2,
                'Xiết nước & Tạo khô hạn',
                'Ngưng tưới, đào rãnh thoát nước, xử lý ra hoa.',
                3,
                false,
                false,
                1,
                'CARE',
                60
            ),
            (
                2,
                'Tưới nước nuôi hoa & trái',
                'Tưới lại khi mắt cua dài 2-3cm, giữ ẩm ổn định.',
                4,
                true,
                false,
                0,
                'CARE',
                3
            ),
            (
                2,
                'Tỉa hoa & Tỉa trái',
                'Loại bỏ hoa, trái dị dạng. Giữ số trái phù hợp.',
                5,
                true,
                false,
                0,
                'CARE',
                15
            ),
            (
                2,
                'Bón phân nuôi trái & Phòng trừ sâu bệnh',
                'Bón NPK theo giai đoạn. Phòng trừ rệp, sâu đục trái.',
                6,
                true,
                false,
                0,
                'CARE',
                15
            ),
            (
                2,
                'Thu hoạch',
                'Thu trái đủ độ chín, tránh thu sau mưa.',
                7,
                true,
                false,
                1,
                'HARVEST',
                1
            ),
            (
                2,
                'Sơ chế & Đóng gói',
                'Phân loại, đóng thùng, ghi chép sản lượng.',
                8,
                false,
                false,
                1,
                'POST_HARVEST',
                0
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE TABLE step RESTART IDENTITY CASCADE");
    }

}
