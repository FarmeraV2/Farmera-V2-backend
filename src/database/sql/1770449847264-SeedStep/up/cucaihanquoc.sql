INSERT INTO "step"
(name, description, "order", repeated, is_optional, min_logs, type, interval_date, min_day_duration, max_day_duration, crop_id)
VALUES
(
    'Làm đất kỹ',
    'Cày sâu 25-30cm, đất tơi xốp. Bón lót phân chuồng + Lân + Borat.',
    10,
    false,
    false,
    1,
    'PREPARE',
    NULL,
    NULL,
    NULL,
    12
),
(
    'Gieo hạt',
    'Gieo hốc (2-3 hạt/hốc). Khoảng cách 25-30cm. Phủ rơm/trấu giữ ẩm.',
    20,
    false,
    false,
    1,
    'PLANTING',
    NULL,
    NULL,
    NULL,
    12
),
(
    'Tưới nước',
    'Tưới đủ ẩm. Tiêu nước kịp thời nếu mưa lớn để tránh thối củ.',
    31,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    12
),
(
    'Tỉa cây & Bón thúc',
    'Tỉa cây 2 đợt (khi 2-3 lá và khi phình củ). Bón thúc kết hợp vun xới. Ngừng đạm 20 ngày trước thu.',
    32,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    12
),
(
    'Thu hoạch',
    'Thu hoạch sau 80-90 ngày. Nhổ cả cây, rũ sạch đất.',
    40,
    false,
    false,
    1,
    'HARVEST',
    NULL,
    NULL,
    NULL,
    12
),
(
    'Sơ chế & Đóng gói',
    'Cắt lá còn 3-4cm. Rửa sạch, đóng túi 1-2kg/túi.',
    50,
    false,
    false,
    1,
    'POST_HARVEST',
    NULL,
    NULL,
    NULL,
    12
);
