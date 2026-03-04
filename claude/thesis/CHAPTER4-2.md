## 4.2 Thiết kế cơ sở dữ liệu

### 4.2.1 Nguyên tắc thiết kế

Cơ sở dữ liệu Farmera V2 được thiết kế xoay quanh một yêu cầu đặc thù: **dữ liệu nông nghiệp phải vừa linh hoạt vừa không thể chối cãi**. Không giống các hệ thống thương mại điện tử thông thường, mỗi nhật ký canh tác trong Farmera mang tính bằng chứng pháp lý — nó được neo cột mốc bất biến trên blockchain, nghĩa là thiết kế database phải đảm bảo tính toàn vẹn dữ liệu ở cả cấp ứng dụng lẫn cấp hạ tầng.

Ba nguyên tắc chính định hướng toàn bộ thiết kế. Nguyên tắc đầu tiên là **phân tách định danh công khai và khóa nội bộ**: mỗi thực thể có hai định danh — UUID công khai (exposed qua API) và auto-increment integer (dùng cho JOIN và foreign key nội bộ). UUID ngăn enumeration attack (kẻ tấn công không thể đoán ID tuần tự), trong khi integer đảm bảo hiệu năng query với B-tree index. Nguyên tắc thứ hai là **JSONB cho dữ liệu cấu trúc linh hoạt**: hai trường quan trọng nhất của hệ thống — `location` (tọa độ GPS của mảnh đất và nhật ký) và `transparency_score` (điểm FTES dạng cấu trúc đa chiều) — được lưu dạng JSONB thay vì các cột riêng. Điều này cho phép schema của điểm minh bạch thay đổi qua các phiên bản FTES mà không cần migration. Nguyên tắc thứ ba là **audit trail bất bypass bằng database trigger**: các trigger PostgreSQL ghi lại mọi thay đổi trên bảng nhạy cảm (farm, log, season) vào bảng `audit` ngay tầng database — không thể bị bỏ qua dù code ứng dụng hay truy cập trực tiếp database.

> 📸 **[Ảnh kiến trúc: Sơ đồ ERD tổng thể — toàn bộ bảng và quan hệ foreign key]**

### 4.2.2 Nhóm bảng quản lý canh tác — Xương sống của hệ thống

Hệ thống phân cấp canh tác được mô hình hóa qua năm bảng chính theo chuỗi: `crop` → `plot` → `season` → `season_detail` → `log`. Chuỗi này ánh xạ trực tiếp vào quy trình canh tác thực tế: mỗi loại cây trồng (`crop`) có bộ quy trình mẫu VietGAP; nông dân canh tác trên mảnh đất cụ thể (`plot`) theo từng mùa vụ (`season`); mỗi mùa vụ thực hiện lần lượt các bước quy trình (`season_detail` là thực thể JOIN giữa `season` và `step`); và mỗi bước được ghi chép bằng các nhật ký bằng chứng (`log`).

Bảng `step` là nơi chứa template VietGAP. Mỗi step có trường `order` là số nguyên (10, 20, 30...) xác định thứ tự thực hiện, kết hợp với kiểu `type` (PREPARE, PLANTING, CARE, HARVEST, POST_HARVEST) tương ứng với năm giai đoạn tiêu chuẩn VietGAP. Thiết kế `order` theo nhóm thập phân cho phép insert step phụ (10, 11, 12 là sub-steps của giai đoạn 10) mà không vi phạm thứ tự — hệ thống kiểm tra `Math.floor(order/10)` để xác định "nhóm giai đoạn" thay vì kiểm tra giá trị tuyệt đối.

Bảng `season_detail` là thực thể trung tâm của toàn bộ trạng thái sản xuất. Nó lưu `step_status` (PENDING/IN_PROGRESS/DONE) để kiểm soát tiến trình, `transaction_hash` là bằng chứng on-chain khi bước được xác minh, và `transparency_score` là điểm tin cậy của bước tính bởi FTES engine. Trường `inactive_logs` đếm số nhật ký bị từ chối hoặc bỏ qua — dùng cho công thức tính điểm Verification Rate.

Bảng `log` là đơn vị bằng chứng cơ bản nhất. Mỗi nhật ký chứa mảng `image_urls[]` và `video_urls[]` (PostgreSQL array type), `location` JSONB {lat, lng} cho xác minh GPS, và `status` (Pending/Verified/Rejected/Skipped) phản ánh kết quả xác minh. Trường `transaction_hash` liên kết nhật ký với giao dịch blockchain tương ứng — đây là cầu nối quan trọng giữa dữ liệu off-chain và bằng chứng on-chain.

### 4.2.3 Nhóm bảng xác minh

Nhóm bảng xác minh hỗ trợ pipeline kiểm tra ảnh hai lớp. Bảng `image_hash` lưu perceptual hash 64-bit (kiểu `bit(64)` của PostgreSQL) cho mỗi ảnh đã upload, kèm `farm_id` để phục vụ truy vấn cross-farm duplicate detection. Câu truy vấn dùng hàm `bit_count()` để tính Hamming distance trực tiếp trong SQL — tận dụng khả năng tính toán bitwise của PostgreSQL mà không cần load dữ liệu lên ứng dụng.

Bảng `log_image_verification_result` lưu kết quả tổng hợp của cả hai lớp xác minh: `overall_score` (0–1), `is_duplicate`, `relevance_score`, `manipulation_score`, và `ai_analysis` dạng JSONB chứa toàn bộ kết quả chi tiết từ Google Vision API. Bảng này phục vụ hai mục đích: làm cơ sở định tuyến (route log đến auditor hay tự động duyệt), và là tài liệu minh chứng hiển thị cho kiểm định viên khi họ nhận nhiệm vụ.

Bảng `verification_assignment` ghi lại việc phân công kiểm định viên: `auditor_profile_id`, `log_id`, `deadline`, và `vote_transaction_hash` (hash của giao dịch blockchain khi auditor submit phiếu). Đây là bảng bridge giữa sự kiện on-chain (VerificationRequested) và thực thể người dùng off-chain — cron job polling blockchain sẽ tạo các record này khi nhận được event từ `AuditorRegistry`.

### 4.2.4 Các nhóm bảng còn lại

Nhóm bảng Identity lưu thông tin người dùng và trang trại. Bảng `user` có `role` enum (BUYER/FARMER/ADMIN/AUDITOR) và hai trường hash quan trọng: `password_hash` (bcrypt) và `refresh_token_hash` — lưu hash của refresh token thay vì token gốc để nếu database bị lộ, token cũng không thể dùng được. Bảng `farm` có `transparency_score` JSONB — lưu điểm FTES theo cấu trúc `{overall, breakdown: {documentation, verification, timeliness}, confidence, lastUpdated}`.

Nhóm bảng Commerce có `product` liên kết với cả `farm_id` lẫn `season_id` — đây là mắt xích truy xuất nguồn gốc: từ một sản phẩm có thể trace ngược về mùa vụ, từ mùa vụ trace về từng bước quy trình và nhật ký bằng chứng. Nhóm bảng System có `transparency_weight` — bảng cấu hình runtime cho phép điều chỉnh trọng số FTES qua API admin mà không cần redeploy, và `blockchain_sync_state` lưu block number đã xử lý để cron job event listener không xử lý lại event cũ.

> 📸 **[Ảnh kiến trúc: Sơ đồ ERD chi tiết nhóm Supply Chain — crop, plot, season, season_detail, log và các quan hệ]**

---

