import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCrop1769667312726 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "crop" (
                id,
                name,
                crop_type,
                description,
                image_urls,
                max_seasons
            )
            VALUES
            (
                1,
                'Thanh Long Ruột Trắng (Bình Thuận)',
                'LONG_TERM',
                'Giống chủ lực tại Bình Thuận, vỏ đỏ, tai xanh, ruột trắng. Sinh trưởng mạnh, chịu hạn tốt. Ra hoa tự nhiên tháng 4-9, chong đèn tháng 10-3 năm sau.',
                ARRAY['https://example.com/thanhlong_trang.jpg'],
                20
            ),
            (
                2,
                'Sầu Riêng VietGAP (Ri6/Monthong)',
                'LONG_TERM',
                'Quy trình canh tác sầu riêng chuẩn VietGAP, áp dụng cho các giống phổ biến như Ri6, DONA (Monthong). Chu kỳ từ phục hồi sau thu hoạch đến thu hoạch lứa tiếp theo.',
                ARRAY['https://example.com/sau-rieng-cover.jpg'],
                30
            ),
            (
                5,
                'Hành Paro / Hành Dài (Hàn Quốc)',
                'SHORT_TERM',
                'Giống hành Hàn Quốc (Jang Yeol, Heuk Geum Jang). Thân dài, trắng, chịu nhiệt tốt. Thời gian sinh trưởng 100-120 ngày.',
                ARRAY['https://example.com/hanh-paro.jpg'],
                3
            ),
            (
                6,
                'Bí Ngồi (Zucchini)',
                'SHORT_TERM',
                'Cây bụi, không leo. Thu hoạch liên tục khi quả đạt 25-35cm. Thụ phấn bổ sung để đậu quả tốt. Vòng đời 70-80 ngày.',
                ARRAY['https://example.com/bi-ngoi.jpg'],
                4
            ),
            (
                7,
                'Cải Củ Hàn Quốc (Radish)',
                'SHORT_TERM',
                'Củ to, sinh trưởng 80-90 ngày. Yêu cầu đất tơi xốp, vun xới kỹ. Ngừng đạm 20 ngày trước thu hoạch.',
                ARRAY['https://example.com/cai-cu.jpg'],
                3
            ),
            (
                8,
                'Cải Thảo (Napa Cabbage)',
                'SHORT_TERM',
                'Cây ưa mát, cuốn bắp chặt. Thời gian 65-70 ngày sau trồng. Yêu cầu quản lý nước và phân bón chặt chẽ.',
                ARRAY['https://example.com/cai-thao.jpg'],
                4
            );
        `);
    }



    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE TABLE crop RESTART IDENTITY CASCADE");
    }

}
