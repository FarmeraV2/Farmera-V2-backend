-- Seed Categories and Subcategories for Agricultural Products
-- Author: Generated for Farmera-V2-backend
-- Date: 2026-01-11

-- Insert Categories
INSERT INTO category (name, description, image_url) VALUES
('Rau củ quả', 'Các loại rau, củ và quả tươi sống', NULL),
('Trái cây', 'Các loại trái cây tươi ngon theo mùa', NULL),
('Ngũ cốc & Hạt', 'Gạo, ngô, đậu và các loại hạt khác', NULL),
('Thực phẩm chế biến', 'Sản phẩm nông nghiệp đã qua chế biến', NULL),
('Gia vị & Thảo mộc', 'Các loại gia vị và thảo mộc tự nhiên', NULL),
('Sản phẩm hữu cơ', 'Sản phẩm nông nghiệp hữu cơ được chứng nhận', NULL)
ON CONFLICT DO NOTHING;

-- Insert Subcategories for 'Rau củ quả'
INSERT INTO subcategory (name, description, category_id) VALUES
-- Rau lá
('Rau lá', 'Rau xanh ăn lá như rau muống, cải xanh, xà lách', (SELECT category_id FROM category WHERE name = 'Rau củ quả' LIMIT 1)),
('Rau thơm', 'Các loại rau thơm như húng quế, ngò, hành, tía tô', (SELECT category_id FROM category WHERE name = 'Rau củ quả' LIMIT 1)),
('Rau củ', 'Củ cải, cà rốt, khoai tây, khoai lang', (SELECT category_id FROM category WHERE name = 'Rau củ quả' LIMIT 1)),
('Rau quả', 'Cà chua, dưa chuột, bầu, bí, mướp', (SELECT category_id FROM category WHERE name = 'Rau củ quả' LIMIT 1)),
('Rau gia vị', 'Tỏi, hành tây, gừng, sả', (SELECT category_id FROM category WHERE name = 'Rau củ quả' LIMIT 1)),

-- Trái cây
('Trái cây nhiệt đới', 'Xoài, dứa, mít, sầu riêng, chôm chôm', (SELECT category_id FROM category WHERE name = 'Trái cây' LIMIT 1)),
('Trái cây có múi', 'Cam, quýt, bưởi, chanh', (SELECT category_id FROM category WHERE name = 'Trái cây' LIMIT 1)),
('Trái cây ôn đới', 'Táo, lê, nho, dâu tây', (SELECT category_id FROM category WHERE name = 'Trái cây' LIMIT 1)),
('Chuối & Dừa', 'Các loại chuối và dừa tươi', (SELECT category_id FROM category WHERE name = 'Trái cây' LIMIT 1)),
('Trái cây đặc sản', 'Vải, nhãn, thanh long, măng cụt', (SELECT category_id FROM category WHERE name = 'Trái cây' LIMIT 1)),

-- Ngũ cốc & Hạt
('Gạo', 'Gạo trắng, gạo lứt, gạo nếp', (SELECT category_id FROM category WHERE name = 'Ngũ cốc & Hạt' LIMIT 1)),
('Ngô', 'Ngô tươi và ngô sấy khô', (SELECT category_id FROM category WHERE name = 'Ngũ cốc & Hạt' LIMIT 1)),
('Đậu các loại', 'Đậu xanh, đậu đen, đậu đỏ, đậu nành', (SELECT category_id FROM category WHERE name = 'Ngũ cốc & Hạt' LIMIT 1)),
('Hạt dinh dưỡng', 'Hạt điều, hạt sen, hạt chia, hạt lanh', (SELECT category_id FROM category WHERE name = 'Ngũ cốc & Hạt' LIMIT 1)),

-- Thực phẩm chế biến
('Rau củ sấy khô', 'Rau củ đã được sấy khô bảo quản', (SELECT category_id FROM category WHERE name = 'Thực phẩm chế biến' LIMIT 1)),
('Trái cây sấy', 'Trái cây sấy khô, mứt trái cây', (SELECT category_id FROM category WHERE name = 'Thực phẩm chế biến' LIMIT 1)),
('Bột & Tinh bột', 'Bột gạo, bột mì, bột sắn, tinh bột', (SELECT category_id FROM category WHERE name = 'Thực phẩm chế biến' LIMIT 1)),
('Nước ép & Sinh tố', 'Nước ép trái cây, sinh tố đóng chai', (SELECT category_id FROM category WHERE name = 'Thực phẩm chế biến' LIMIT 1)),
('Mật ong & Sản phẩm ong', 'Mật ong nguyên chất, phấn hoa, sữa ong chúa', (SELECT category_id FROM category WHERE name = 'Thực phẩm chế biến' LIMIT 1)),

-- Gia vị & Thảo mộc
('Ớt & Tiêu', 'Ớt tươi, ớt khô, tiêu các loại', (SELECT category_id FROM category WHERE name = 'Gia vị & Thảo mộc' LIMIT 1)),
('Thảo mộc khô', 'Lá chanh, lá ngải, lá húng các loại khô', (SELECT category_id FROM category WHERE name = 'Gia vị & Thảo mộc' LIMIT 1)),
('Gia vị hạt', 'Hồi, đinh hương, quế, thảo quả', (SELECT category_id FROM category WHERE name = 'Gia vị & Thảo mộc' LIMIT 1)),
('Muối & Đường', 'Muối biển, muối hồng, đường mía, đường thốt nốt', (SELECT category_id FROM category WHERE name = 'Gia vị & Thảo mộc' LIMIT 1)),

-- Sản phẩm hữu cơ
('Rau hữu cơ', 'Rau củ được trồng theo phương pháp hữu cơ', (SELECT category_id FROM category WHERE name = 'Sản phẩm hữu cơ' LIMIT 1)),
('Trái cây hữu cơ', 'Trái cây hữu cơ không hóa chất', (SELECT category_id FROM category WHERE name = 'Sản phẩm hữu cơ' LIMIT 1)),
('Gạo hữu cơ', 'Gạo trồng theo tiêu chuẩn hữu cơ', (SELECT category_id FROM category WHERE name = 'Sản phẩm hữu cơ' LIMIT 1)),
('Gia vị hữu cơ', 'Gia vị và thảo mộc hữu cơ', (SELECT category_id FROM category WHERE name = 'Sản phẩm hữu cơ' LIMIT 1))

ON CONFLICT DO NOTHING;

-- Display inserted data
SELECT 'Categories inserted:' as info;
SELECT category_id, name, description FROM category ORDER BY category_id;

SELECT '' as separator;
SELECT 'Subcategories inserted:' as info;
SELECT s.subcategory_id, s.name, c.name as category_name 
FROM subcategory s 
JOIN category c ON s.category_id = c.category_id 
ORDER BY c.category_id, s.subcategory_id;
