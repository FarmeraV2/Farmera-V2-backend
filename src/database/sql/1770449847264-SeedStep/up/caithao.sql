INSERT INTO "step"
(name, description, "order", repeated, is_optional, min_logs, type, interval_date, min_day_duration, max_day_duration, crop_id)
VALUES
(
    'Trồng cây con',
    'Trồng khi cây 4-6 lá thật (18-25 ngày tuổi). Khoảng cách 40x60cm.',
    20,
    false,
    false,
    1,
    'PLANTING',
    NULL,
    NULL,
    NULL,
    13
),
(
    'Tưới nước',
    'Tưới 1-2 ngày/lần. Có thể tưới rãnh hoặc tưới hốc. Giữ ẩm 70-80%.',
    31,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    13
),
(
    'Bón phân thúc',
    'Bón 3 lần: Sau trồng 15 ngày, Thời kỳ trải lá bàng, Thời kỳ cuốn bắp. Ngừng đạm 15 ngày trước thu.',
    32,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    13
),
(
    'Thu hoạch',
    'Thu hoạch sau 65-70 ngày. Cắt bỏ gốc, giữ 2-3 lá xanh bao ngoài.',
    40,
    false,
    false,
    1,
    'HARVEST',
    NULL,
    NULL,
    NULL,
    13
),
(
    'Sơ chế & Đóng gói',
    'Loại bỏ lá già, hỏng. Đóng thùng hoặc túi lưới.',
    50,
    false,
    false,
    1,
    'POST_HARVEST',
    NULL,
    NULL,
    NULL,
    13
);
