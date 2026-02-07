INSERT INTO "step"
(name, description, "order", repeated, is_optional, min_logs, type, interval_date, min_day_duration, max_day_duration, crop_id)
VALUES
(
    'Làm đất & Lên luống',
    'Làm đất tơi nhỏ, pH 6.0-6.5. Lên luống cao 25-30cm. Bón lót phân chuồng + Lân.',
    10,
    false,
    false,
    1,
    'PREPARE',
    NULL,
    NULL,
    NULL,
    10
),
(
    'Trồng cây con',
    'Trồng cây 3-4 lá thật. Khoảng cách cây 2-3cm, hàng dọc luống.',
    20,
    false,
    false,
    1,
    'PLANTING',
    NULL,
    NULL,
    NULL,
    10
),
(
    'Tưới nước',
    'Tưới 1-2 lần/ngày khi mới trồng. Sau đó tưới giữ ẩm thường xuyên.',
    31,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    10
),
(
    'Bón phân & Vun gốc',
    'Bón thúc 2 đợt (ngày 15, ngày 35). Vun gốc định kỳ 15-20 ngày/lần để trắng thân. Ngừng đạm 10 ngày trước thu.',
    32,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    10
),
(
    'Thu hoạch',
    'Thu hoạch sau trồng. Nhổ cả rễ, rũ sạch đất.',
    40,
    false,
    false,
    1,
    'HARVEST',
    NULL,
    NULL,
    NULL,
    10
),
(
    'Sơ chế & Đóng gói',
    'Loại bỏ lá vàng, bó thành bó, đóng bao bì. Vận chuyển nơi thoáng mát.',
    50,
    false,
    false,
    1,
    'POST_HARVEST',
    NULL,
    NULL,
    NULL,
    10
);