# MỤC LỤC CHI TIẾT — BÁO CÁO ĐỒ ÁN TỐT NGHIỆP

**Tên đề tài:** Farmera V2 — Thiết kế và xây dựng chợ số thông minh cho thực phẩm sạch với cơ chế minh bạch quy trình sản xuất dựa trên công nghệ blockchain

---

## [Chương 1: Mở Đầu](./CHAPTER1.md)

### 1.1 Đặt vấn đề
### 1.1.1 Thực trạng
- 1.1.1.1 Tình hình an toàn thực phẩm tại Việt Nam
- 1.1.1.2 Thực trạng ứng dụng công nghệ blockchain trong nông nghiệp

### 1.2 Mục tiêu đề tài
### 1.3 Phạm vi đề tài
- 1.3.1 Nội dung nghiên cứu chính
- 1.3.2 Đối tượng nghiên cứu, thực thể và tập dữ liệu liên quan

---

## [Chương 2: Tổng Quan](./CHAPTER2.md)

### 2.1 Các sản phẩm tương tự trên thị trường
- 2.1.1 IBM Food Trust (Hyperledger Fabric, B2B enterprise)
- 2.1.2 TE-FOOD (blockchain riêng + QR, thị trường châu Á)
- 2.1.3 OriginTrail — Decentralized Knowledge Graph (OT-DKG)
- 2.1.4 VinEco / Vingroup — Hệ thống truy xuất nội bộ
- 2.1.5 Nền tảng chợ điện tử nông sản Việt Nam (Sendo Farm, Bachhoaxanh, Tiki Ngon)

### 2.2 Tổng kết ưu nhược điểm các sản phẩm tương tự
- 2.2.1 Bảng so sánh tổng hợp (blockchain công khai, chấm điểm, thương mại, AI xác minh, GPS)
- 2.2.2 Khoảng trống thị trường: ba vấn đề chưa được giải quyết đồng thời
- 2.2.3 Định vị Farmera V2 so với thị trường

---

## [Chương 3: Các Vấn Đề và Giải Pháp](./CHAPTER3.md)

### 3.1 Vấn đề 1 — Tính toàn vẹn dữ liệu sản xuất
- 3.1.1 Giới hạn của cơ sở dữ liệu tập trung và mô hình tin tưởng đơn lẻ
- 3.1.2 Xác minh phi tin cậy (trustless verification) và yêu cầu về bằng chứng công khai
- 3.1.3 Giải pháp: Neo cột mốc bất biến bằng hàm băm mật mã trên blockchain (Blockchain Anchoring)
- 3.1.4 Cơ chế bảo vệ nội dung trong khoảng thời gian chờ xác minh

### 3.2 Vấn đề 2 — Tính xác thực của nội dung tự khai báo
- 3.2.1 Oracle problem — giới hạn cơ bản của blockchain trong xác minh thế giới thực
- 3.2.2 Giải pháp: Xác minh nội dung đa lớp (Multi-Layer Content Verification)
- 3.2.3 Lớp 1: Phân tích ảnh tự động — Perceptual Hashing và Computer Vision
- 3.2.4 Lớp 2: Định tuyến theo rủi ro (Risk-Based Routing) và lý thuyết trò chơi trong lấy mẫu ngẫu nhiên
- 3.2.5 Lớp 3: Đồng thuận kiểm định viên phi tập trung với cơ chế kinh tế stake/slash

### 3.3 Vấn đề 3 — Định lượng chất lượng nhật ký
- 3.3.1 Hạn chế của kết quả nhị phân và nhu cầu về thang điểm liên tục
- 3.3.2 Giải pháp: TrustScore — điểm tin cậy bất biến trên chuỗi khối
- 3.3.3 Mô hình cho nhật ký tự phê duyệt: Tính hợp lệ địa lý và đầy đủ bằng chứng
- 3.3.4 Mô hình cho nhật ký qua kiểm định: Beta Reputation System và đồng thuận có trọng số uy tín
- 3.3.5 So sánh hai mô hình và nguyên tắc tính điểm một lần (immutable scoring)

### 3.4 Vấn đề 4 — Tổng hợp độ minh bạch toàn trang trại
- 3.4.1 Giới hạn của điểm cấp nhật ký và nhu cầu đánh giá tổng thể
- 3.4.2 Tiền đề: VietGAP như chuẩn tham chiếu quy trình bắt buộc — điều kiện để điểm số có ý nghĩa so sánh
- 3.4.3 Giải pháp: Mô hình FTES

### 3.5 Vấn đề 5 — Danh tính và tính hợp lệ của trang trại
- 3.5.1 Rủi ro Sybil attack và dữ liệu FTES giả mạo
- 3.5.2 Giải pháp: Xác minh sinh trắc học hai giai đoạn (liveness detection + đối chiếu giấy tờ)
- 3.5.3 Phê duyệt thủ công như lớp kiểm soát bổ sung và trách nhiệm giải trình

### 3.6 Vấn đề 6 — Kết nối minh bạch với thị trường
- 3.6.1 Thiếu vòng phản hồi kinh tế — lý do hệ thống truy xuất thất bại trong thực tế
- 3.6.2 Giải pháp: Tích hợp thương mại điện tử với minh bạch là trục trung tâm
- 3.6.3 Vòng khép kín: minh bạch → điểm FTES → niềm tin → lợi thế giá → động lực duy trì

---

## Chương 4: Thiết Kế và Xây Dựng Hệ Thống Farmera V2

### 4.1 Tổng quan kiến trúc hệ thống

#### 4.1.1 Sơ đồ ngữ cảnh (C4 Level 1 — System Context)
- Hai tác nhân chính: Người Mua và Nông Dân
- Sáu hệ thống ngoài: zkSync Network, Google Cloud Vision, Twilio/SendGrid, R2 Storage, GHN, FPT API
- Ranh giới on-chain/off-chain và nguyên tắc Commitment Hash

#### 4.1.2 Sơ đồ Container (C4 Level 2)
- Flutter Mobile App — NestJS API Server — PostgreSQL — Smart Contracts
- Các kênh giao tiếp: HTTPS/JWT, TCP TypeORM, JSON-RPC Web3, S3-compatible API

#### 4.1.3 Mô tả các thành phần chính
- Flutter: Clean Architecture + MVVM, Riverpod 3.0, GoRouter, không Web3 trực tiếp
- NestJS: Modular Monolith, Oracle Bridge Pattern, 13+ feature modules
- PostgreSQL: UUID + auto-increment, JSONB, database triggers cho audit trail
- Smart Contracts: ProcessTracking, TrustComputation, MetricSelection, AuditorRegistry, hai LogPackage

#### 4.1.4 Lựa chọn công nghệ
- Backend Framework — NestJS 11
- Cơ sở dữ liệu — PostgreSQL 16
- Blockchain Network — zkSync Era (L2 ZK Rollup)
- Lưu trữ File — Cloudflare R2
- AI Vision — Google Cloud Vision API
- Push Notification — Firebase Cloud Messaging
- SMS và Email — Twilio + SendGrid
- Tích hợp Vận chuyển — GHN API
- Hạ tầng triển khai — Self-hosted VPS + Cloudflare Tunnel

---

### 4.2 Thiết kế cơ sở dữ liệu

#### 4.2.1 Nguyên tắc thiết kế và mô hình hóa
- UUID public ID + auto-increment internal ID: cân bằng security (không expose sequential ID) và performance (integer FK trong JOIN)
- JSONB columns cho `location` và `transparency_score`: cấu trúc linh hoạt không cần schema migration
- Soft delete (`is_active`) thay vì DELETE: duy trì audit trail đầy đủ
- Database Trigger cho Audit Trail: ghi log bất biến ngay tầng database, không thể bypass

#### 4.2.2 Nhóm bảng quản lý canh tác (Supply Chain Core)
- `crop`: loại cây (SHORT_TERM/LONG_TERM), `max_seasons`, template master
- `step`: bước VietGAP với `order` (thứ tự số), `type` (PREPARE/PLANTING/CARE/HARVEST/POST_HARVEST), `min_logs`, `is_optional`, `repeated`, duration constraints
- `plot`: mảnh đất canh tác, `location` JSONB (lat/lng), `area`, liên kết với `crop`
- `season`: một chu kỳ canh tác, `status` (PENDING/IN_PROGRESS/COMPLETED), `expected_yield`, `actual_yield`
- `season_detail`: thực thể JOIN Season × Step, `step_status` (PENDING/IN_PROGRESS/DONE), `transparency_score`, `transaction_hash`
- `log`: nhật ký bằng chứng, `image_urls[]`, `video_urls[]`, `location` JSONB, `status` (Pending/Verified/Rejected/Skipped), `transaction_hash`

#### 4.2.3 Nhóm bảng xác minh (Verification)
- `image_hash`: pHash 64-bit per ảnh, `farm_id` FK — phục vụ cross-farm duplicate detection
- `log_image_verification_result`: kết quả tổng hợp AI: `overall_score`, `is_duplicate`, `relevance_score`, `manipulation_score`, `ai_analysis` JSONB
- `verification_assignment`: auditor được phân công, `deadline`, `vote_transaction_hash`
- `auditor_profile`: wallet address, `verification_count`, mirror on-chain status

#### 4.2.4 Nhóm bảng danh tính và trang trại (Identity & Farm)
- `user`: UUID, `role` (BUYER/FARMER/ADMIN/AUDITOR), `status`, `password_hash`, `refresh_token_hash`
- `farm`: `transparency_score` JSONB, `status`, owner FK
- `identification`, `farm_certificate`, `farm_approval`: KYC workflow và approval chain

#### 4.2.5 Nhóm bảng thương mại (Commerce)
- `product`: liên kết Farm + Season (traceability anchor), `status`, price
- `order`, `order_detail`, `payment`, `delivery`: vòng đời đơn hàng đầy đủ
- `qr`: QR metadata cho deep link truy xuất nguồn gốc

#### 4.2.6 Nhóm bảng hệ thống (System)
- `audit`, `audit_event`: business event trail không thể xóa
- `transparency_weight`: trọng số FTES có thể hiệu chỉnh runtime không cần redeploy
- `blockchain_sync_state`: block number đã đồng bộ — phục vụ event listener cron job

---

### 4.3 Chi tiết thiết kế hệ thống

#### 4.3.1 Quản lý quy trình canh tác theo tiêu chuẩn VietGAP

##### 4.3.1.1 Mô hình hóa tiêu chuẩn VietGAP thành cấu trúc dữ liệu
- VietGAP với năm giai đoạn bắt buộc: PREPARE → PLANTING → CARE → HARVEST → POST_HARVEST
- Cấu trúc Plot → Season → SeasonDetail (step instance) → Log
- Ràng buộc thứ tự: `order` trường số (10, 20, 30...), `Math.floor(order/10)` định nghĩa "nhóm giai đoạn"
- Gating: bước trước phải DONE trước khi thêm bước tiếp theo

##### 4.3.1.2 Kiểm soát tiến trình và tính toàn vẹn
- `validateAddSeasonStep()`: 5 quy tắc kiểm tra (crop match, order sequence, status gate, first step, gap validation)
- `min_logs` constraint: mỗi bước yêu cầu số lượng nhật ký tối thiểu trước khi hoàn thành
- Trạng thái step: PENDING → IN_PROGRESS (khi có log đầu tiên) → DONE (sau xác minh đủ log)

#### 4.3.2 Pipeline xác minh nhật ký hai lớp

##### 4.3.2.1 Lớp 1 — Xác minh AI tự động (ImageVerificationService)
- pHash duplicate detection: resize 8×8, Hamming distance ≤ 10 → cross-farm duplicate
- Google Vision LABEL_DETECTION: so khớp `AGRICULTURAL_LABELS` set, WebDetection, SafeSearch
- Điểm AI: `0.35 × relevance + 0.35 × originality + 0.30 × (1 - duplicate)`
- Ngưỡng định tuyến: score < 0.6 → bắt buộc auditor; 0.6–0.8 → sampling 20%; ≥ 0.8 → tự động duyệt

##### 4.3.2.2 Lớp 2 — Xác minh kiểm định viên phi tập trung
- Trigger: `LogAddedEvent` → `evaluateForVerification()` → nếu cần auditor → `addTempLog()` (immutability checkpoint) + `requestVerification()` (VRF)
- Cron job polling blockchain events mỗi 10 giây: `handleRequestEvents()`, `handleFinalizedEvents()`
- Đồng bộ assignment: `VerificationAssignment` record tạo khi `VerificationRequested` event nhận được

#### 4.3.3 ProcessTracking — Lưu trữ bất biến trên blockchain

##### 4.3.3.1 Cơ chế Write-Once và Commitment Hash
- SHA-256 hash của `HashedLog` DTO (id, name, description, image_urls[], location, created, farm_id, status)
- Write-once: revert `ProcessTracking__InvalidLogId` nếu `s_logs[logId]` đã có giá trị
- Hierarchy on-chain: `s_season[seasonId] → stepIds[]` và `s_seasonStepLogs[stepId] → logIds[]`
- TempLog pattern: ghi hash trước khi auditor review để đảm bảo log không bị chỉnh sửa trong lúc chờ

##### 4.3.3.2 Oracle Bridge Pattern (Server Wallet)
- `WALLET_PRIVATE_KEY`: server ký tất cả transaction gửi lên blockchain
- ABI-encoded payload: dữ liệu off-chain encode thành `bytes` trước khi truyền vào smart contract
- Auditor không cần ví riêng để vote (UX đơn giản hơn) — đánh đổi: server là điểm trung gian tin cậy

#### 4.3.4 Thiết kế TrustWorthiness Smart Contract

##### 4.3.4.1 Nền tảng lý thuyết — Leteane & Ayalew (2024)
- Vấn đề cốt lõi của truy xuất nguồn gốc thực phẩm: blockchain đảm bảo dữ liệu không bị sửa đổi sau khi ghi, nhưng không ngăn được dữ liệu sai từ đầu ("garbage in, garbage out") (Leteane & Ayalew, 2024)
- Giải pháp: kết hợp blockchain với mô hình Trust — định lượng mức độ tin cậy của từng thực thể đóng góp dữ liệu
- Beta Reputation System (Jøsang & Ismail, 2002) làm mô hình Trust: xác suất hậu nghiệm từ phân phối Beta

##### 4.3.4.2 Kiến trúc Pluggable Trust Package
- `MetricSelection.sol`: registry `keccak256(dataType+context) → package address`
- `TrustPackage` interface: `computeTrustScore(bytes) → (bool accept, uint128 score)`
- `LogDefaultPackage.sol` (context="system"): dùng khi AI score ≥ 0.8
- `LogAuditorPackage.sol` (context="auditor"): dùng khi có auditor voting
- Pluggable: thêm thuật toán mới = deploy contract mới + gọi `registerTrustPackage()`, không redeploy core

##### 4.3.4.3 LogDefaultPackage — Mô hình tự động không cần kiểm định
- `Tsp` (Spatial Plausibility, 60%): khoảng cách Euclidean² giữa GPS log và tọa độ plot ≤ MAX_DISTANCE²
- `Tec` (Evidence Completeness, 40%): `min((imageCount + videoCount) × 50, 100)`
- `Score = (60 × Tsp + 40 × Tec) / 100`, accept ≥ 60

##### 4.3.4.4 LogAuditorPackage — Beta Reputation Consensus
- `Tc` (Consensus, 55%): `α/(α+β) × 100` với α = Σ reputationScore(isValid=true), β = Σ reputationScore(isValid=false)
- `Tsp` (Spatial, 30%) + `Te` (Evidence, 15%): cùng công thức LogDefaultPackage
- `Score = (55 × Tc + 30 × Tsp + 15 × Te) / 100`, accept ≥ 70 (ngưỡng cao hơn vì có auditor)
- Trọng số reputation: auditor có reputation cao → vote có trọng số lớn hơn trong đồng thuận

#### 4.3.5 Hệ thống quản lý kiểm định viên (AuditorRegistry)

##### 4.3.5.1 Cơ chế Stake và Đăng ký
- `registerAuditor()`: `msg.value ≥ MIN_STAKE (~$1 USD)` quy đổi qua Chainlink Price Feed ETH/USD
- `reputationScore` khởi tạo = 50 (INITIAL_REPUTATION) — trung lập, chưa có lịch sử
- `stakedTokens` = lượng ETH stake thực tế — vừa là điều kiện gia nhập, vừa là phần tài sản có thể bị slash

##### 4.3.5.2 Chọn ngẫu nhiên có xác minh bằng Chainlink VRF 2.5
- `requestVerification()` → `s_vrfCoordinator.requestRandomWords()` → Chainlink node tạo proof → `fulfillRandomWords()` callback
- Fisher-Yates Partial Shuffle: dùng `randomWords[0]` làm seed, shuffle mảng `auditorAddresses[]`, chọn 5 phần tử đầu
- `keccak256(abi.encode(randomSeed, i))` cho mỗi bước shuffle — đảm bảo không có auditor nào can thiệp được kết quả

##### 4.3.5.3 Voting, Finalization và Reward/Slash
- Deadline 7 ngày: auditor có `VERIFICATION_DEADLINE_DAYS` để submit vote
- Auto-finalize khi đủ `MIN_AUDITORS` (5) phiếu; hoặc `finalizeExpired()` sau deadline
- Consensus: `validVotes = Σ reputation(isValid=true)`, `invalidVotes = Σ reputation(isValid=false)`, `consensus = validVotes > invalidVotes`
- Reward: vote đúng → `reputationScore += 2`; vote sai → `reputationScore -= 5`, `stakedTokens -= 0.1 ETH`
- Deactivation: nếu `stakedTokens` dưới `MIN_STAKE` sau slash → `isActive = false`, xóa khỏi `auditorAddresses[]` bằng swap-and-pop O(1)

#### 4.3.6 Cơ chế tính điểm minh bạch FTES

##### 4.3.6.1 Kiến trúc ba cấp và nguồn dữ liệu
- Cấp 1 (Step): `S_step = 0.50 × DC + 0.35 × VR + 0.15 × TR` — đọc từ PostgreSQL (log count, status) + Blockchain (trustScore)
- Cấp 2 (Season): `S_season = PT^0.65 × SA^0.20 × OC^0.15` (geometric mean) — tổng hợp từ step scores + yield data
- Cấp 3 (Farm): Bayesian Beta Aggregation — `α = 2 (prior)`, cộng dồn qua các mùa vụ → `result = α/(α+β)`

##### 4.3.6.2 Trọng số VietGAP và khả năng hiệu chỉnh
- Step type weights: CARE (0.5) > HARVEST (0.2) > PREPARE/PLANTING/POST_HARVEST (0.1) — phản ánh tầm quan trọng từng giai đoạn
- `TransparencyWeight` table: trọng số lưu trong database, hiệu chỉnh qua API không cần redeploy
- Bayesian parameters: `N_EFF = 5`, `PRIOR_ALPHA = PRIOR_BETA = 2` — prior trung lập, hội tụ sau ~5 mùa vụ

---

## Chương 5: Kết Quả Đạt Được

### 5.1 Kết quả chức năng
- 5.1.1 Danh sách tính năng đã hoàn thành (theo nhóm người dùng)
- 5.1.2 Demo giao diện ứng dụng di động (screenshot / screen recording)
- 5.1.3 Demo luồng xác minh nhật ký end-to-end

### 5.2 Kết quả kỹ thuật
- 5.2.1 Smart contract đã deploy — transaction minh chứng trên zkSync Era explorer
- 5.2.2 Kiểm thử API (Postman / Jest unit tests)
- 5.2.3 Hiệu năng hệ thống (response time, throughput cơ bản)
- 5.2.4 Độ chính xác xác minh ảnh (mẫu test với Google Vision API)

### 5.3 Đánh giá theo mục tiêu đề ra
- 5.3.1 Bảng đánh giá từng mục tiêu (đạt / chưa đạt / đạt một phần)
- 5.3.2 Hạn chế còn tồn tại

---

## Chương 6: Kết Luận và Phương Hướng Phát Triển

### 6.1 Kết luận
- 6.1.1 Tóm tắt những gì đã xây dựng được
- 6.1.2 Đóng góp kỹ thuật của đề tài
- 6.1.3 Bài học kinh nghiệm

### 6.2 Phương hướng phát triển
- 6.2.1 Hoàn thiện FTES v2 (tích hợp đầy đủ TransparencyStep / Season / Farm)
- 6.2.2 Mở rộng mạng lưới kiểm định viên thực tế
- 6.2.3 Tích hợp IoT sensors (nhiệt độ, độ ẩm, tự động ghi nhật ký)
- 6.2.4 Cải thiện AI xác minh (fine-tune model riêng cho nông nghiệp Việt Nam)
- 6.2.5 Mở rộng sang PWA, tích hợp thêm đơn vị vận chuyển
- 6.2.6 Tokenomics cho nền tảng (FTES score → discount, auditor incentive)

---

## Tài Liệu Tham Khảo

- RFC 7519 — JSON Web Token (JWT)
- Jøsang & Ismail (2002) — The Beta Reputation System
- Nakamoto, S. (2008) — Bitcoin: A Peer-to-Peer Electronic Cash System
- Wood, G. — Ethereum: A Secure Decentralised Generalised Transaction Ledger (Yellow Paper)
- Matter Labs — zkSync Era Documentation
- Chainlink Documentation — VRF & Price Feeds
- NestJS Official Documentation (docs.nestjs.com)
- TypeORM Documentation (typeorm.io)
- Google Cloud Vision API Documentation
- GHN API Documentation
- Tiêu chuẩn VietGAP — Bộ Nông nghiệp và Phát triển Nông thôn Việt Nam
- FAO / CGIAR — Blockchain for agriculture and food systems

---

## Ghi Chú Ưu Tiên Nội Dung

| Phần | Độ ưu tiên | Ghi chú |
|---|---|---|
| Chương 3 (6 vấn đề + giải pháp) | ⭐⭐⭐ Cao nhất | Trái tim của đồ án — phân biệt với hệ thống thông thường |
| Mục 4.4 (Smart Contract) | ⭐⭐⭐ Cao nhất | Đặc trưng kỹ thuật blockchain nổi bật nhất |
| Mục 4.6 (Business Flows) | ⭐⭐⭐ Cao nhất | Giải thích hệ thống hoạt động thực tế |
| Chương 2 (so sánh sản phẩm) | ⭐⭐ Trung bình | Đã có nội dung tốt trong THESIS_REPORT.md |
| Mục 4.2 (lý do chọn tech) | ⭐⭐ Trung bình | Đã có nội dung tốt, cần tóm gọn |
| Chương 5 (kết quả) | ⭐⭐ Trung bình | Cần bổ sung screenshot và demo thực tế |
| Chương 1 + Chương 6 | ⭐ Thấp nhất | Viết sau cùng khi nội dung chính đã hoàn thiện |
