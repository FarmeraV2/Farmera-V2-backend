INSERT INTO "step"
(name, description, "order", repeated, is_optional, min_logs, type, interval_date, min_day_duration, max_day_duration, crop_id)
VALUES
(
    'Làm đất & Phủ luống',
    'Đất tơi xốp, pH 5.5-6.5. Bón lót phân chuồng. Phủ màng nông nghiệp để hạn chế cỏ dại.',
    10,
    false,
    false,
    1,
    'PREPARE',
    NULL,
    NULL,
    NULL,
    11
),
(
    'Trồng cây con',
    'Trồng khi cây 1-2 lá thật. Khoảng cách 80-100cm.',
    20,
    false,
    false,
    1,
    'PLANTING',
    NULL,
    NULL,
    NULL,
    11
),
(
    'Tưới nước',
    'Giữ ẩm 70-75%. Tưới rãnh hoặc nhỏ giọt.',
    31,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    11
),
(
    'Bón phân & Thụ phấn bổ sung',
    'Bón thúc 3 lần. Thụ phấn nhân tạo lúc 7-10h sáng khi hoa nở rộ để đậu quả tốt.',
    32,
    true,
    false,
    1,
    'CARE',
    NULL,
    NULL,
    NULL,
    11
),
(
    'Thu hoạch',
    'Thu hái khi quả dài 25-35cm. Dùng dao cắt cuống. Thu liên tục 5-7 ngày sau khi hoa nở.',
    40,
    true,
    false,
    1,
    'HARVEST',
    NULL,
    NULL,
    NULL,
    11
),
(
    'Sơ chế & Đóng gói',
    'Xếp vào thùng, tránh dập nát. Bảo quản mát <20 độ C.',
    50,
    true,
    false,
    1,
    'POST_HARVEST',
    NULL,
    NULL,
    NULL,
    11
);
