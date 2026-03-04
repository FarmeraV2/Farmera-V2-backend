## Chương 4: Chi Tiết Hệ Thống — Thiết Kế và Triển Khai

### 4.1 Tổng quan kiến trúc hệ thống

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title Farmera — C4 Level 1: System Context Diagram

Person(buyer, "Người Mua (Buyer)", "Khách hàng tìm kiếm và mua nông sản an toàn có nguồn gốc rõ ràng.")
Person(farmer, "Nông Dân (Farmer)", "Chủ trang trại quản lý quy trình sản xuất và bán sản phẩm.")

System(farmera, "Farmera V2", "Nền tảng truy xuất nguồn gốc nông sản, quản lý sản xuất và giao dịch, tích hợp blockchain và dịch vụ xác minh.")

System_Ext(ethereum, "Ethereum Network", "Lưu trữ nhật ký bất biến và tính điểm tin cậy.")
System_Ext(gcloud_vision, "Google Cloud Vision API", "Phân tích hình ảnh nông nghiệp.")
System_Ext(twilio, "Twilio / SendGrid", "Gửi OTP SMS và Email xác minh.")
System_Ext(file_storage, "R2 Storage", "Lưu trữ ảnh và video.")
System_Ext(ghn, "GHN Delivery", "Xử lý vận chuyển.")
System_Ext(fpt, "FPT API", "Xác thực CCCD và khuôn mặt.")

Rel(buyer, farmera, "Sử dụng hệ thống")
Rel(farmer, farmera, "Sử dụng hệ thống")

Rel(farmera, ethereum, "Ghi nhật ký và đọc dữ liệu blockchain")
Rel(farmera, gcloud_vision, "Phân tích hình ảnh")
Rel(farmera, twilio, "Gửi OTP xác minh")
Rel(farmera, file_storage, "Lưu trữ tệp")
Rel(farmera, ghn, "Tạo đơn vận chuyển")
Rel(farmera, fpt, "Xác thực danh tính")

@enduml
```

Farmera là một hệ thống đa thành phần, trong đó mỗi thành phần đảm nhận một vai trò rõ ràng và tương tác với nhau qua các giao thức chuẩn. Kiến trúc tổng thể bao gồm các thành phần chính: ứng dụng di động (client), API backend, PostgreSQL database, hệ thống blockchain (zkSync - Layer 2 trên Ethereum) và các dịch vụ bên thứ ba.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Farmera V2 — C4 Level 2: Container Diagram

Person(buyer, "Người Mua", "")
Person(farmer, "Nông Dân", "")

System_Boundary(farmera, "Hệ thống Farmera V2") {
    Container(mobile_app, "Flutter Mobile Application", "Flutter", "Ứng dụng di động đa nền tảng iOS/Android theo Clean Architecture và MVVM.")
    Container(nestjs_api, "NestJS API Server", "NestJS", "Backend REST API xử lý toàn bộ business logic.")
    ContainerDb(postgres, "PostgreSQL Database", "PostgreSQL", "Lưu trữ toàn bộ dữ liệu quan hệ.")
}

System_Ext(ethereum, "Ethereum Network", "Lưu trữ nhật ký bất biến, tính điểm tin cậy và quản lý xác thực auditor.")
System_Ext(gcloud_vision, "Google Cloud Vision API", "Phân tích ảnh nông nghiệp.")
System_Ext(twilio, "Twilio / SendGrid", "Gửi OTP SMS và Email.")
System_Ext(file_storage, "R2 Storage", "Lưu trữ ảnh và video.")
System_Ext(ghn, "GHN Delivery", "Xử lý giao hàng.")
System_Ext(fpt, "FPT API", "Xác thực CCCD và khuôn mặt.")

Rel(buyer, mobile_app, "Duyệt sản phẩm, đặt hàng,\nxem lịch sử sản xuất") 
Rel(farmer, mobile_app, "Quản lý trang trại,\nghi chép quy trình sản xuất")

Rel(mobile_app, nestjs_api, "Gọi REST API", "HTTPS/JSON Bearer JWT")
Rel(nestjs_api, postgres, "Reads/Writes dữ liệu", "TCP:5432 via TypeORM")
Rel(nestjs_api, ethereum, "Gửi signed transaction và đọc dữ liệu on-chain", "JSON-RPC over HTTPS")
Rel(nestjs_api, gcloud_vision, "Phân tích ảnh", "HTTPS REST API")
Rel(nestjs_api, fpt, "Xác thực danh tính", "HTTPS REST API")
Rel(nestjs_api, twilio, "Gửi OTP", "HTTPS REST API")
Rel(nestjs_api, file_storage, "Upload và Download file", "HTTPS S3-compatible API")
Rel(nestjs_api, ghn, "Tạo đơn và tính phí giao hàng", "HTTPS REST API")

@enduml
```

#### 4.1.1 Flutter Mobile App — Ứng dụng di động

Ứng dụng di động Farmera được xây dựng bằng Flutter, cho phép triển khai đồng thời trên cả Android và iOS từ một codebase duy nhất. Ứng dụng phục vụ hai nhóm người dùng với luồng tác vụ khác nhau: nông dân sử dụng các tính năng ghi nhật ký canh tác, quản lý mảnh đất, mùa vụ và theo dõi điểm minh bạch FTES của trang trại mình; người mua duyệt danh mục sản phẩm, tra cứu nguồn gốc, đặt hàng và theo dõi trạng thái vận chuyển

---

#### 4.1.2 NestJS 11 Backend — Máy chủ API

Backend là thành phần trung tâm của hệ thống, xây dựng theo kiến trúc Module-based Monolith với NestJS 11 — mỗi tính năng nghiệp vụ là một module độc lập với Controller, Service và các Provider riêng, liên kết với nhau qua Dependency Injection container của NestJS.
Các Business Module tổ chức theo tính năng: user và farm quản lý tài khoản và đăng ký trang trại; crop-management là module lớn nhất, gom toàn bộ luồng canh tác từ mảnh đất đến nhật ký - bao gồm cả xác minh ảnh và kiểm định viên; ftes chứa engine tính điểm minh bạch; blockchain đóng gói toàn bộ giao tiếp với smart contract. Ngoài ra, backend còn cài đặt một module độc lập chuyên trách lắng nghe và đồng bộ sự kiện blockchain. Thay vì để backend chính liên tục polling blockchain (tốn tài nguyên), Verification Service chạy cron job mỗi phút để đọc các sự kiện mới từ blockchain, dịch chúng sang các hành động trong hệ thống.

---

#### 4.1.3 PostgreSQL — Cơ sở dữ liệu quan hệ chính

PostgreSQL là nơi lưu trữ toàn bộ dữ liệu ứng dụng từ thông tin người dùng, trang trại, sản phẩm, đơn hàng đến kết quả xác minh ảnh và lịch sử điểm minh bạch. 

---

#### 4.1.4 Smart Contracts trên zkSync Era — Lớp Blockchain

Lớp blockchain gồm bộ smart contract viết bằng Solidity, triển khai trên mạng zkSync Era (Ethereum Layer 2 sử dụng ZK Rollup). Đây là thành phần duy nhất trong hệ thống mà dữ liệu được ghi vào là bất biến tuyệt đối — không ai, kể cả nhà vận hành hệ thống, có thể chỉnh sửa sau khi giao dịch được xác nhận.

---

#### 4.1.5 Các dịch vụ bên thứ ba

Google Cloud Vision API cung cấp khả năng phân tích nội dung ảnh - phân loại nhãn (label detection), phát hiện ảnh tải từ internet (web detection) và kiểm tra nội dung không phù hợp (safe search). Đây là nền tảng cho lớp xác minh ảnh tự động trong pipeline FTES, quyết định nhật ký nào cần gửi lên kiểm định viên.
GHN (Giao Hàng Nhanh) API xử lý toàn bộ nghiệp vụ vận chuyển: tính phí giao hàng theo địa chỉ thực tế, tạo đơn vận chuyển, và gửi webhook khi trạng thái kiện hàng thay đổi (lấy hàng → đang vận chuyển → đã giao). Người mua nhận thông báo tự động ở mỗi bước mà không cần backend chủ động polling.
Twilio / SendGrid đảm nhận gửi SMS / Email OTP khi xác minh số điện thoại hoặc cần xác nhận giao dịch quan trọng.
FPT API xử lí nhận diện CCCD và khuôn mặt.

---

#### 4.1.6 Công nghệ sử dụng và lý do lựa chọn
##### 4.1.6.1 Backend Framework — NestJS 11

**Lựa chọn:** NestJS 11

**So sánh với các phương án:**

| Tiêu chí | **NestJS** | Express.js | Fastify | Spring Boot | Django/FastAPI |
|---|---|---|---|---|---|
| Ngôn ngữ | TypeScript native | JS/TS | JS/TS | Java | Python |
| Kiến trúc | Module-based, DI | Tự do | Tự do | Module, DI | MVC/MVT |
| Bộ decorator & Guard | Có sẵn | Không | Hạn chế | Có sẵn | Hạn chế |
| Tích hợp TypeORM/Prisma | Tích hợp sẵn | Thủ công | Thủ công | JPA riêng | Django ORM / SQLAlchemy |
| Hỗ trợ CQRS, Event Emitter | Module riêng | Thư viện ngoài | Thư viện ngoài | Spring Events | Celery/signals |
| Cron job tích hợp | `@nestjs/schedule` | Thủ công | Thủ công | `@Scheduled` | Celery Beat |
| Guard / Middleware toàn cục | Có sẵn, rõ ràng | Middleware | Hook | Filter/Interceptor | Middleware |
| Validation pipe | `class-validator` tích hợp | Thủ công | Plugin | Bean Validation | Pydantic |
| Hiệu năng (req/s) | Cao (Fastify adapter) | Cao | Rất cao | Trung bình | Thấp-Trung bình |
| Học curve | Trung bình | Thấp | Thấp | Cao (Java) | Thấp-Trung bình |

**Lý do chọn NestJS:**

Farmera V2 có hơn **13 module nghiệp vụ độc lập** (user, farm, crop-management, ftes, blockchain, order, payment, review, qr, notification, address, admin, product) với các lớp cross-cutting concerns (authentication, logging, validation, transformation). NestJS giải quyết trực tiếp những thách thức này:

1. **Kiến trúc module cứng nhắc:** Mỗi module là một đơn vị tự quản với Controller, Service, Provider và các dependency rõ ràng. Điều này buộc nhóm phát triển tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns) ngay từ cấu trúc file, giảm nguy cơ "spaghetti code" khi dự án mở rộng.

2. **Dependency Injection (DI) container:** NestJS có DI container tích hợp, cho phép inject service vào controller mà không cần khởi tạo thủ công. Điều này đặc biệt quan trọng khi `BlockchainModule` cần được inject vào `CropManagementModule` và `FtesModule` mà không tạo circular dependency.

3. **Hệ sinh thái `@nestjs/*`:** Các module chính thức như `@nestjs/jwt`, `@nestjs/typeorm`, `@nestjs/schedule`, `@nestjs/event-emitter` cho phép tích hợp nhanh chóng mà không cần cấu hình thủ công. Ví dụ, `@Cron('0 3 * * *')` trên method là đủ để lập lịch cron job tính điểm FTES.

4. **Guard và Interceptor toàn cục:** `JwtAuthGuard` đặt globally nghĩa là tất cả route đều yêu cầu xác thực theo mặc định — một quyết định bảo mật an toàn hơn Express (nơi phải nhớ đặt middleware từng route). `TransformInterceptor` bọc toàn bộ response tự động.

**Tại sao không chọn:**
- *Express.js:* Thiếu cấu trúc, phù hợp cho microservice nhỏ nhưng không quản lý được độ phức tạp của Farmera V2 mà không tự tạo kiến trúc.
- *Spring Boot:* Hệ sinh thái Java không tương thích với phần còn lại của stack TypeScript; overhead JVM không cần thiết cho scope đồ án.
- *FastAPI (Python):* Hệ sinh thái blockchain (Web3.js) là JavaScript-first; việc tách đôi ngôn ngữ giữa backend và blockchain integration sẽ tạo thêm ma sát phát triển.

---

#### 4.1.6.2 Cơ sở dữ liệu — PostgreSQL

**Lựa chọn:** PostgreSQL 16.x

**So sánh với các phương án:**

| Tiêu chí | **PostgreSQL** | MySQL 8 | MongoDB | CockroachDB |
|---|---|---|---|---|
| Loại | Quan hệ (RDBMS) | Quan hệ | Document (NoSQL) | Phân tán (SQL) |
| JSONB | Tốt (indexed) | Hạn chế | Native | Tốt |
| Database Trigger | Đầy đủ | Có | Không | Có |
| Full-text Search | Tích hợp | Hạn chế | Atlas Search | Tích hợp |
| ACID Compliance | Đầy đủ | Đầy đủ | Có (từ v4.0) | Đầy đủ |
| Phân tán | Không native | Không native | Tốt | Tốt |
| Hỗ trợ Array type | Tốt | Không | Native | Có |
| TypeORM support | Tốt nhất | Tốt | Khác ORM | Tốt |
| Window Functions | Đầy đủ | Đầy đủ | Không | Đầy đủ |
| Chi phí | Miễn phí (OSS) | Miễn phí (Community) | Atlas (cloud) tốn phí | Tốn phí (cloud) |

**Lý do chọn PostgreSQL:**

1. **Dữ liệu quan hệ chặt chẽ:** Mô hình dữ liệu Farmera V2 có nhiều quan hệ phức tạp (Farm → Plot → Season → Step → Log, Order → OrderItem → Product → Farm...). RDBMS với foreign key, cascade delete và transaction ACID đảm bảo tính toàn vẹn dữ liệu tốt hơn NoSQL.

2. **JSONB cho điểm FTES:** Điểm minh bạch của trang trại (`TransparencyFarm`) được lưu dạng JSONB trong bảng farm, cho phép query theo giá trị bên trong JSON mà không cần schema cứng — linh hoạt khi cấu trúc điểm thay đổi theo phiên bản FTES.

3. **Database Trigger cho Audit Trail:** Hệ thống cần ghi audit log tự động cho mọi thay đổi trên bảng nhạy cảm. PostgreSQL `TRIGGER` + `BEFORE/AFTER UPDATE` là giải pháp đảm bảo audit không thể bị bypass ngay cả khi có truy cập trực tiếp database — MongoDB và MySQL không có hệ thống trigger đủ linh hoạt cho yêu cầu này.

4. **Array type:** Lưu trữ danh sách labels từ Google Vision API (ví dụ: `['farming', 'agriculture', 'plant']`) trực tiếp trong column PostgreSQL array mà không cần bảng phụ.

5. **Window Functions và CTE:** Dùng cho tính toán điểm FTES phức tạp, query ranking trang trại theo điểm minh bạch.

**Tại sao không chọn:**
- *MongoDB:* Thiếu đảm bảo ACID giữa các collection, không có foreign key thực sự — nguy hiểm trong nghiệp vụ thanh toán và đơn hàng. Không hỗ trợ database trigger đủ mạnh cho audit trail.
- *MySQL:* PostgreSQL có tính năng nâng cao hơn (JSONB indexing, Array type, CTE phức tạp) và được TypeORM support tốt hơn trong môi trường NestJS.
- *CockroachDB:* Chi phí vận hành cao hơn cho dự án đồ án tốt nghiệp; phân tán là overkill cho quy mô hiện tại.

---

#### 4.1.6.3 Blockchain Network — zkSync Era (Layer 2)

**Lựa chọn:** zkSync Era (Ethereum L2 — ZK Rollup)

Đây là quyết định quan trọng nhất về hạ tầng — ảnh hưởng trực tiếp đến chi phí vận hành và tính khả thi của hệ thống.

**So sánh với các phương án:**

| Tiêu chí | **zkSync Era** | Ethereum Mainnet | Polygon PoS | Hyperledger Fabric | Solana |
|---|---|---|---|---|---|
| Loại | L2 ZK Rollup | L1 Public | L2 PoS Sidechain | L1 Permissioned | L1 Public |
| Chi phí giao dịch | ~$0.01–0.10 | ~$1–50 | ~$0.001–0.01 | Gần như 0 | ~$0.0001 |
| Tốc độ xác nhận | ~1–2 giây | 12–15 giây | ~2 giây | <1 giây | <1 giây |
| Bảo mật | Kế thừa Ethereum | Ethereum L1 | PoS bridge (rủi ro cao hơn) | Validator nội bộ | Proof of History |
| EVM tương thích | Hoàn toàn | Hoàn toàn | Hoàn toàn | Không | Không |
| Tái sử dụng Solidity | Có | Có | Có | Không | Không |
| Public verifiability | Có | Có | Có | Không (permissioned) | Có |
| Phi tập trung | Đang dần phi tập trung | Hoàn toàn | Trung bình | Không (consortium) | Cao |
| Chainlink Price Feed | Có | Có | Có | Không | Có |
| Công cụ phát triển | Hardhat, Foundry | Hardhat, Foundry | Hardhat | Hyperledger Composer | Anchor |

**Lý do chọn zkSync Era:**

**Vấn đề cốt lõi: Chi phí giao dịch quyết định tính khả thi.**

Farmera V2 ghi hash lên blockchain cho *mỗi nhật ký canh tác*. Một trang trại hoạt động tốt có thể ghi 5–10 nhật ký/ngày. Với 100 trang trại:

| Mạng | Chi phí/tx ước tính | Chi phí/ngày (100 trang trại × 7 tx) | Chi phí/năm |
|---|---|---|---|
| Ethereum Mainnet | ~$5 (giờ thấp điểm) | ~$3,500 | ~$1,277,500 |
| Polygon PoS | ~$0.005 | ~$3.5 | ~$1,277 |
| **zkSync Era** | ~$0.02–0.05 | ~$14–35 | ~$5,110–12,775 |
| Hyperledger | $0 | $0 | $0 (nhưng không public) |

→ Ethereum Mainnet: **không khả thi** về chi phí cho bài toán ghi nhật ký tần suất cao.
→ Polygon PoS: Chi phí thấp nhất nhưng bảo mật phụ thuộc vào bridge — đã có sự cố bridge $600M năm 2022.
→ **zkSync Era:** Cân bằng tốt — chi phí chấp nhận được, bảo mật kế thừa Ethereum qua ZK proof (không có bridge rủi ro như Polygon), EVM tương thích hoàn toàn cho phép tái sử dụng toàn bộ công cụ Solidity.

**Tại sao không chọn Hyperledger Fabric:**
Mặc dù chi phí = 0 và tốc độ cao, Hyperledger là blockchain **có phép (permissioned)** — chỉ các tổ chức được phép mới có thể tham gia xác nhận. Điều này phá vỡ yêu cầu cốt lõi của hệ thống: *bất kỳ ai cũng có thể xác minh hash độc lập mà không cần tin tưởng nhà vận hành*. Mục đích dùng blockchain của Farmera là tính **verifiability công khai** — không thể đạt được với Hyperledger.

**Tại sao không chọn Solana:**
Solana không tương thích EVM, yêu cầu viết smart contract bằng Rust với Anchor framework — hoàn toàn khác hệ sinh thái Solidity. Chi phí tái học tập và phát triển quá lớn so với lợi ích (Solana nhanh hơn nhưng chi phí đã đủ thấp với zkSync).

---

#### 4.1.6.4 Lưu trữ File — Cloudflare R2

**Lựa chọn:** Cloudflare R2

**So sánh với các phương án:**

| Tiêu chí | **Cloudflare R2** | AWS S3 | Azure Blob | Google Cloud Storage | Pinata (IPFS) |
|---|---|---|---|---|---|
| Chi phí lưu trữ ($/GB/tháng) | $0.015 | $0.023 | $0.018 | $0.020 | $0.10 |
| Chi phí egress (ra internet) | **$0** | $0.09/GB | $0.08/GB | $0.12/GB | Theo plan |
| CDN tích hợp | Cloudflare Network (global) | CloudFront (thêm phí) | Azure CDN (thêm phí) | Cloud CDN (thêm phí) | Không |
| Tương thích API | S3-compatible | AWS S3 native | Riêng (`@azure/storage-blob`) | Riêng | SDK riêng |
| Tích hợp SDK Node.js | `@aws-sdk/client-s3` | `@aws-sdk/client-s3` | `@azure/storage-blob` | `@google-cloud/storage` | `pinata` SDK |
| Public bucket URL | Có | Có | Có | Có | IPFS gateway (chậm) |
| SLA | 99.9% | 99.9% | 99.9% | 99.9% | Tùy gateway |
| Free tier | 10 GB/tháng | 5 GB (12 tháng) | 5 GB (12 tháng) | 5 GB | Theo plan |

**Lý do chọn Cloudflare R2:**

**Vấn đề cốt lõi: Chi phí egress phá vỡ ngân sách của đồ án tốt nghiệp.**

Farmera V2 lưu trữ và phục vụ ảnh trang trại liên tục — ảnh sản phẩm hiển thị mỗi khi người mua duyệt danh mục, ảnh nhật ký canh tác tải khi truy xuất nguồn gốc. Đây là workload *read-heavy*: mỗi lượt xem sản phẩm tải 3–5 ảnh; với 1,000 người dùng/ngày, lượng egress có thể đạt hàng chục GB/ngày.

| Provider | Chi phí lưu trữ 50 GB | Chi phí egress 100 GB/tháng | Tổng/tháng |
|---|---|---|---|
| AWS S3 | $1.15 | **$9.00** | ~$10.15 |
| Azure Blob | $0.90 | **$8.00** | ~$8.90 |
| Google Cloud Storage | $1.00 | **$12.00** | ~$13.00 |
| **Cloudflare R2** | $0.75 | **$0** | **~$0.75** |

→ R2 tiết kiệm **90–95% chi phí** so với các nhà cung cấp cloud lớn khi workload có nhiều truy cập ảnh.

1. **Zero egress cost:** Cloudflare R2 không tính phí bandwidth ra internet — đây là điểm khác biệt lớn nhất. AWS, Azure, GCP đều tính $0.08–0.12/GB egress; khi phục vụ ảnh cho người dùng, chi phí này cộng dồn nhanh chóng.

2. **S3-compatible API:** R2 tương thích hoàn toàn với AWS S3 API — sử dụng cùng `@aws-sdk/client-s3` với chỉ đổi endpoint URL. Điều này có nghĩa là *không có vendor lock-in*: nếu cần migrate sang AWS S3 trong tương lai, chỉ cần đổi biến môi trường, không đổi một dòng code nào.

3. **Cloudflare CDN toàn cầu:** File được phục vụ qua Cloudflare network (300+ PoP toàn cầu) — latency thấp cho cả người dùng Việt Nam lẫn quốc tế, tự động cache ảnh tĩnh ở edge.

4. **Chi phí lưu trữ thấp nhất:** $0.015/GB/tháng thấp hơn AWS S3 ($0.023) và Azure Blob ($0.018).

5. **Free tier rộng rãi:** 10 GB storage + 1 triệu Class A operations (write) + 10 triệu Class B operations (read) miễn phí mỗi tháng — đủ cho toàn bộ giai đoạn phát triển và testing mà không tốn chi phí.

**Kiến trúc Factory Pattern — linh hoạt nhưng R2 là production choice:**

Mặc dù Cloudflare R2 là provider được chọn cho môi trường production, hệ thống vẫn được thiết kế theo Abstract Factory Pattern với interface `IFileStorage` và biến môi trường `STORAGE_TYPE` để chọn provider:

```
STORAGE_TYPE=r2     → CloudflareR2Storage (production)
STORAGE_TYPE=local  → LocalFileStorage (development/testing)
STORAGE_TYPE=azure  → AzureBlobStorage (migration path nếu cần)
```

Pattern này không phải là "không quyết định" mà là thiết kế phòng thủ: R2 là lựa chọn hiện tại vì chi phí tốt nhất, nhưng kiến trúc không ràng buộc hệ thống vào một provider — nếu R2 tăng giá hay có sự cố, có thể chuyển sang provider khác mà không đổi business logic.

**Tại sao không chọn các phương án khác:**
- *AWS S3:* Chi phí egress $0.09/GB — với workload ảnh tần suất cao, chi phí này không phù hợp với ngân sách đồ án. R2 có S3-compatible API nên không có lý do gì chọn S3 thay R2.
- *Azure Blob:* Ecosystem phức tạp hơn, SDK riêng (không S3-compatible), chi phí egress cao tương tự S3. Chỉ phù hợp nếu hệ thống đã dùng Azure toàn bộ (Azure VM, Azure DB...) để tận dụng free internal transfer.
- *Google Cloud Storage:* Chi phí egress cao nhất ($0.12/GB), không có lợi thế rõ ràng so với R2 cho use case này.
- *Pinata/IPFS:* IPFS gateway chậm và không ổn định cho việc hiển thị ảnh theo thời gian thực (latency 1–5 giây thay vì <100ms của CDN). Chi phí cao ($0.10/GB storage). Pinata phù hợp cho lưu trữ dữ liệu phi tập trung dài hạn, không phải cho ảnh sản phẩm cần tải nhanh.

---

#### 4.2.11 AI Vision — Google Cloud Vision API

**Lựa chọn:** Google Cloud Vision API v1

**So sánh với các phương án:**

| Tiêu chí | **Google Cloud Vision** | AWS Rekognition | Azure Computer Vision | Mô hình tự huấn luyện |
|---|---|---|---|---|
| Nhận diện nhãn (label detection) | Có | Có | Có | Có (nếu đủ data) |
| Phát hiện text (OCR) | Có | Có | Có | Phức tạp |
| Phát hiện SafeSearch | Có | Content Moderation | Có | Phức tạp |
| Landmark detection | Có | Không | Hạn chế | Không |
| Chi phí (per 1000 images) | $1.5 | $1.0 | $1.0 | Chi phí hạ tầng GPU |
| Accuracy (benchmark) | Rất cao | Cao | Cao | Phụ thuộc dataset |
| Tích hợp Node.js | `@google-cloud/vision` | `@aws-sdk/client-rekognition` | `@azure/cognitiveservices-computervision` | TensorFlow.js / ONNX |
| Latency | <500ms | <500ms | <500ms | <100ms (local) |
| Nhu cầu data riêng | Không | Không | Không | Có (500–10000+ ảnh) |

**Lý do chọn Google Cloud Vision:**

Xác minh ảnh canh tác là bài toán **phân loại nhãn chung** (label detection): ảnh có chứa đối tượng nông nghiệp không? (cây trồng, đất, phân bón, máy nông nghiệp...). Google Vision API với Label Detection Pre-trained Model đạt accuracy rất cao cho object detection tổng quát mà **không cần huấn luyện dữ liệu riêng** — điều này quan trọng với dự án đồ án không có sẵn dataset nông nghiệp quy mô lớn.

Bên cạnh đó, `@google-cloud/vision` là package chính thức, typed đầy đủ TypeScript, và có thể gọi đồng bộ dễ tích hợp vào NestJS service.

**Tại sao không tự huấn luyện mô hình:**
Cần ít nhất hàng nghìn ảnh nông nghiệp được gán nhãn chuẩn (labeled dataset), cơ sở hạ tầng GPU cho training, và pipeline MLOps để deploy và update model. Đây là scope quá lớn cho một đồ án tốt nghiệp không có mục tiêu nghiên cứu AI. Google Vision API cho phép tập trung vào logic nghiệp vụ cốt lõi.

---

#### 4.2.13 SMS và Email — Twilio + SendGrid

**Lựa chọn:** Twilio (SMS/Voice) + SendGrid (Transactional Email)

**So sánh với các phương án:**

| Tiêu chí | **Twilio + SendGrid** | AWS SNS + SES | Vonage (Nexmo) | Mailgun |
|---|---|---|---|---|
| SMS Việt Nam | Tốt (đầu số quốc tế và trong nước) | Hạn chế (SIM pool) | Tốt | Không hỗ trợ SMS |
| Transactional Email | SendGrid: Tốt | SES: Tốt | Không chuyên | Tốt |
| Tích hợp Node.js | `twilio` SDK chính thức | `@aws-sdk/client-sns` | `@vonage/server-sdk` | `mailgun.js` |
| Deliverability email | Rất cao | Cao | Cao | Cao |
| Chi phí SMS (VN) | ~$0.045/tin | ~$0.02–0.05/tin | ~$0.04/tin | — |
| Template email | SendGrid Dynamic Templates | SES Templates | Không | Có |
| Số sandbox (phát triển) | Có | Có | Có | Có |

**Lý do chọn Twilio + SendGrid:**

Twilio là nhà cung cấp SMS/Voice lớn nhất thế giới, có hỗ trợ tốt cho thị trường Việt Nam và SDK Node.js chính thức đầy đủ. SendGrid (cùng công ty Twilio) là dịch vụ email giao dịch hàng đầu với deliverability cao, template engine mạnh và analytics chi tiết. Việc dùng hai sản phẩm cùng hệ sinh thái giúp đơn giản hóa quản lý tài khoản và billing.

---

#### 4.2.14 Tích hợp Vận chuyển — GHN (Giao Hàng Nhanh)

**Lựa chọn:** GHN API

**So sánh với các phương án:**

| Tiêu chí | **GHN** | GHTK | Viettel Post | J&T Express |
|---|---|---|---|---|
| Độ phủ (tỉnh/thành) | 63/63 | 63/63 | 63/63 | 63/63 |
| API Documentation | Tốt, tiếng Việt và Anh | Tốt | Trung bình | Trung bình |
| Webhook cập nhật đơn | Có | Có | Hạn chế | Có |
| Tính phí vận chuyển API | Có | Có | Có | Có |
| Sandbox/test environment | Có | Có | Có | Có |
| Tốc độ giao hàng | Nhanh (next-day nội thành) | Nhanh | Trung bình | Trung bình |
| Phù hợp nông sản tươi | Tốt (cold chain option) | Trung bình | Trung bình | Trung bình |
| SDK Node.js | REST API (Axios) | REST API | REST API | REST API |

**Lý do chọn GHN:**

GHN có tài liệu API tốt nhất trong các đơn vị vận chuyển Việt Nam, hỗ trợ webhook để cập nhật trạng thái đơn hàng theo thời gian thực (quan trọng để notify người mua). Hệ thống Farmera V2 vận chuyển nông sản tươi — GHN có dịch vụ cold chain và độ phủ rộng phù hợp. API tính phí vận chuyển theo địa chỉ cho phép hiển thị phí chính xác trước khi đặt hàng.

---

#### 4.2.15 Hạ tầng triển khai — Self-hosted VPS + Cloudflare Tunnel

**Lựa chọn:** VPS tự quản lý + Cloudflare Tunnel (không mở port, không reverse proxy truyền thống)

**So sánh với các phương án:**

| Tiêu chí | **Self-hosted VPS + Cloudflare Tunnel** | AWS EC2 / ECS | Google Cloud Run | Azure App Service | Railway / Render |
|---|---|---|---|---|---|
| Chi phí compute/tháng | ~$5–10 (VPS) | ~$30–200 | ~$20–100 | ~$50–200 | ~$20–50 |
| Chi phí network/bandwidth | Thường gộp trong VPS | $0.09/GB egress | $0.12/GB egress | $0.08/GB egress | Có giới hạn |
| SSL/TLS tự động | Cloudflare (miễn phí) | ACM (miễn phí) | Tự động | Tự động | Tự động |
| DDoS protection | Cloudflare L3/L4/L7 (miễn phí) | AWS Shield Basic | Cloud Armor | Azure DDoS Basic | Hạn chế |
| Auto-scaling | Thủ công | Tự động (ECS) | Tự động | Tự động | Hạn chế |
| Cold start | Không | Không (EC2) / Có (Lambda) | Có | Có | Có |
| Kiểm soát môi trường | Hoàn toàn | Cao | Trung bình | Trung bình | Thấp |
| Mở port public | Không cần (tunnel) | Cần Security Group | Không cần | Không cần | Không cần |
| Thời gian setup | Trung bình | Cao | Thấp | Thấp | Rất thấp |
| Phù hợp quy mô đồ án | Tốt | Overkill | Tốt | Overkill | Tốt |

**Kiến trúc triển khai:**

```
Internet
   │
   ▼
Cloudflare Network (CDN + DDoS Protection + SSL termination)
   │  (Cloudflare Tunnel — encrypted outbound-only connection)
   ▼
Linux VPS (Ubuntu 22.04)
├── Docker Compose
│   ├── nestjs-api     (container: NestJS 11)
│   ├── postgres       (container: PostgreSQL 16)
│   └── redis          (container: Redis 7)
└── cloudflared daemon (Cloudflare Tunnel agent — outbound only)
```

**Lý do chọn Self-hosted + Cloudflare Tunnel:**

**1. Mô hình bảo mật Zero Trust — ưu thế kỹ thuật của Cloudflare Tunnel:**

Đây là lý do kỹ thuật trọng tâm. Self-hosting truyền thống (VPS + Nginx + mở port 80/443) tạo ra bề mặt tấn công trực tiếp: server IP public, cần quản lý firewall rules, SSL certificate renewal, và dễ bị port scan/brute force. Cloudflare Tunnel áp dụng mô hình **Zero Trust Network Access (ZTNA)** hoàn toàn khác:

- **Không có inbound port nào mở ra internet:** `cloudflared` daemon trên VPS chủ động tạo kết nối *outbound* TLS đến Cloudflare edge. Toàn bộ firewall VPS có thể đặt thành "deny all inbound" — không có IP public nào để scan hay tấn công.
- **DDoS protection tại L3/L4/L7:** Cloudflare hấp thụ toàn bộ traffic tấn công tại edge trước khi packet nào đến được VPS — server chỉ nhận HTTP requests đã được lọc và xác thực.
- **SSL/TLS do Cloudflare quản lý:** Certificate tự động gia hạn, hỗ trợ HTTP/2 và HTTP/3 (QUIC) mà không cần cấu hình thêm. Loại bỏ hoàn toàn rủi ro certificate expire gây downtime.
- **Xác thực tầng network:** Có thể thêm Cloudflare Access (zero-trust policy) để yêu cầu xác thực trước khi request được forward đến backend — một lớp bảo vệ không có trong giải pháp cloud thông thường.

Đây là cùng mô hình bảo mật mà các doanh nghiệp lớn dùng để expose internal service mà không cần VPN — Cloudflare gọi là "Cloudflare Tunnel replaces sVPN".

**2. Kiểm soát môi trường hoàn toàn — tránh phụ thuộc vendor:**

Farmera V2 có stack phức tạp: NestJS cần `cloudflared` daemon, PostgreSQL cần custom `pg_trgm` extension cho full-text search, Redis cần cấu hình `maxmemory-policy`. Trên PaaS (Cloud Run, Railway), các tuỳ chỉnh này bị hạn chế hoặc cần thêm chi phí (Cloud SQL không cho phép cài extension tự do ở tier thấp):

- **VPS với Docker Compose:** Cài bất kỳ PostgreSQL extension nào, chỉnh kernel parameter (`vm.overcommit_memory` cho Redis), mount volume tuỳ ý.
- **Không vendor lock-in:** Docker image chạy trên bất kỳ máy nào có Docker — dev laptop, VPS, hay AWS EC2 sau này.
- **Reproducible environment:** `docker compose up` tái tạo chính xác production stack trên máy local để debug — không có "works on my machine" problem.

**3. Right-sizing theo quy mô thực tế:**

Nguyên tắc kiến trúc tốt là infrastructure phải **phù hợp với tải thực tế**, không over-provision. Farmera V2 là hệ thống phục vụ một tập người dùng xác định (kiểm tra, demo, đánh giá) — không phải hệ thống public có spike traffic bất ngờ. Đây là tiêu chí thiết kế quan trọng theo kiến trúc **YAGNI (You Aren't Gonna Need It)**:

- Auto-scaling của Cloud Run/ECS là giải pháp cho vấn đề *chưa tồn tại* ở quy mô hiện tại.
- Cold start của serverless (Cloud Run khởi động container mỗi request sau idle) gây latency không ổn định — tệ hơn VPS luôn chạy cho API cần response time nhất quán.
- Managed database (Cloud SQL, RDS) thêm network hop giữa app container và database — VPS có app và DB cùng Docker network (loopback) cho latency tốt hơn.

**4. Kiến trúc Cloud-ready — không phải Cloud-dependent:**

Quyết định dùng VPS không đồng nghĩa với "không scale được". Toàn bộ hệ thống được thiết kế **cloud-portable** từ đầu:

```
Hiện tại:  docker-compose.yml trên VPS
Tương lai: kompose convert → Kubernetes manifests
           → GCP Cloud Run / AWS ECS Fargate (không đổi Dockerfile)
           → Cloudflare Tunnel vẫn hoạt động (chỉ đổi --url target)
```

Đây là sự khác biệt quan trọng: hệ thống không bị "giam cầm" trong VPS — mà đang chạy trên VPS vì đó là môi trường phù hợp nhất cho phạm vi hiện tại, với đường di chuyển sang cloud rõ ràng khi cần.

**Tại sao không chọn cloud managed services:**

- *AWS EC2/ECS + RDS:* Tổng chi phí ~$70–100/tháng cho stack tương đương. Quan trọng hơn: RDS không cho phép cài custom PostgreSQL extension tự do, và ECS Fargate thêm complexity orchestration không cần thiết ở quy mô này.
- *Google Cloud Run + Cloud SQL:* Cold start của Cloud Run (~1–3 giây sau idle) không phù hợp với API cần latency ổn định. Cloud SQL tier thấp nhất (db-f1-micro) giới hạn connection pool — xung đột với TypeORM connection pooling của NestJS.
- *Railway/Render:* Thiếu control để chỉnh PostgreSQL configuration và Redis persistence policy. Không thể mount volume tuỳ ý cho backup strategy.

---