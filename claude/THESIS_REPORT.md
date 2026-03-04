# FARMERA V2 — CHỢ SỐ THÔNG MINH CHO THỰC PHẨM SẠCH
## Đồ Án Tốt Nghiệp

---

**Tên đề tài:** Farmera V2 — Thiết kế và xây dựng chợ số thông minh cho thực phẩm sạch với cơ chế minh bạch quy trình sản xuất dựa trên công nghệ blockchain

**Chuyên ngành:** Công nghệ Thông tin
**Trường:** Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM
**Ngày:** 2026

---

## MỤC LỤC

- [Chương 1: Mở Đầu](#chương-1-mở-đầu)
  - [1.1 Đặt vấn đề](#11-đặt-vấn-đề)
  - [1.2 Thực trạng](#12-thực-trạng)
  - [1.3 Mục tiêu đề tài](#13-mục-tiêu-đề-tài)
  - [1.4 Phạm vi đề tài](#14-phạm-vi-đề-tài)
- [Chương 2: Tổng Quan](#chương-2-tổng-quan)
  - [2.1 Các sản phẩm tương tự trên thị trường](#21-các-sản-phẩm-tương-tự-trên-thị-trường)
  - [2.2 Tổng kết ưu nhược điểm](#22-tổng-kết-ưu-nhược-điểm-các-sản-phẩm-tương-tự)
- [Chương 3: Các Vấn Đề và Giải Pháp](#chương-3-các-vấn-đề-và-giải-pháp)
- [Chương 4: Chi Tiết Hệ Thống — Thiết Kế và Triển Khai](#chương-4-chi-tiết-hệ-thống--thiết-kế-và-triển-khai)
- [Chương 5: Kết Quả Đạt Được](#chương-5-kết-quả-đạt-được)
- [Chương 6: Kết Luận và Phương Hướng Phát Triển](#chương-6-kết-luận-và-phương-hướng-phát-triển)
- [Tài Liệu Tham Khảo](#tài-liệu-tham-khảo)

---
### 4.3 Quản lý quy trình sản xuất theo tiêu chuẩn VietGAP

#### 4.3.1 VietGAP và yêu cầu số hóa quy trình sản xuất

VietGAP (Vietnamese Good Agricultural Practices) là bộ tiêu chuẩn thực hành nông nghiệp tốt do Bộ Nông nghiệp và Phát triển Nông thôn ban hành, xây dựng trên cơ sở ASEAN GAP và GlobalGAP. Mục tiêu cốt lõi của VietGAP là đảm bảo an toàn thực phẩm thông qua kiểm soát toàn diện quá trình sản xuất — từ đầu vào (giống, phân bón, thuốc BVTV) đến đầu ra (thu hoạch, bảo quản, vận chuyển) — kết hợp với bảo vệ môi trường và điều kiện lao động.

Yêu cầu cốt lõi mà VietGAP đặt ra là **ghi chép nhật ký sản xuất đầy đủ và liên tục**, bao gồm:

| Giai đoạn | Nội dung ghi nhận bắt buộc |
|---|---|
| Chuẩn bị đất | Lịch sử lô đất, xử lý đất, kiểm tra pH/độ ẩm, vật tư đầu vào |
| Gieo trồng | Tên giống, nguồn giống (chứng nhận), ngày gieo, mật độ, phương pháp |
| Chăm sóc | Thuốc BVTV (tên đăng ký, nồng độ, ngày phun, khoảng cách an toàn PHI), phân bón (loại, lượng, ngày bón), tưới tiêu |
| Thu hoạch | Ngày thu hoạch, sản lượng thực tế, đánh giá chất lượng ban đầu |
| Sau thu hoạch | Xử lý, phân loại, đóng gói, điều kiện bảo quản, vận chuyển nội bộ |

Ngoài ra, VietGAP yêu cầu khả năng **truy xuất nguồn gốc** (traceability): từ bất kỳ lô hàng nào trên thị trường đều phải truy ngược được về đến lô đất, mùa vụ và toàn bộ nhật ký sản xuất cụ thể.

Tuy nhiên, trong thực tế, việc ghi nhật ký VietGAP hiện nay phần lớn được thực hiện thủ công trên giấy tờ hoặc bảng tính — dễ làm giả, khó kiểm tra và không thể xác minh tính xác thực một cách độc lập. Farmera V2 giải quyết vấn đề này bằng cách **số hóa toàn bộ nhật ký VietGAP vào một mô hình dữ liệu cấu trúc, kết hợp cơ chế xác minh và lưu trữ bất biến trên blockchain**.

#### 4.3.2 Mô hình phân cấp dữ liệu canh tác

Hệ thống tổ chức dữ liệu canh tác theo phân cấp 5 tầng, ánh xạ trực tiếp với cấu trúc quản lý trong VietGAP:

```
Trang trại (Farm)
    └── Mảnh đất (Plot)
    │       Thuộc tính: diện tích, tọa độ GPS trung tâm, loại cây trồng
    │       Ý nghĩa: đơn vị canh tác có thể định vị thực địa
    │
    └── Mùa vụ (Season)
    │       Thuộc tính: loại cây, ngày bắt đầu/dự kiến kết thúc, sản lượng dự kiến
    │       Ý nghĩa: một chu kỳ canh tác hoàn chỉnh (vụ đông xuân, vụ hè thu...)
    │
    └── Bước sản xuất (Step / SeasonDetail)
    │       Loại: PREPARE | PLANTING | CARE | HARVEST | POST_HARVEST
    │       Ý nghĩa: một trong 5 giai đoạn bắt buộc của VietGAP
    │
    └── Nhật ký canh tác (Log)
            Thuộc tính: mô tả hoạt động, GPS tại thời điểm ghi, timestamp
            Bằng chứng: Hình ảnh + Tọa độ GPS + SHA-256 hash on-chain
            Ý nghĩa: đơn vị ghi nhận tối tiểu, được xác minh và neo trên blockchain
```

Mỗi tầng phân cấp có vai trò xác định trong chuỗi truy xuất nguồn gốc:

| Tầng | Tương ứng VietGAP | Vai trò trong hệ thống |
|---|---|---|
| **Farm** | Cơ sở sản xuất | Đơn vị đăng ký, chịu trách nhiệm pháp lý, mang điểm Farm Score |
| **Plot** | Lô đất/vườn được quản lý | Đơn vị canh tác vật lý, xác định bằng GPS |
| **Season** | Vụ sản xuất | Chu kỳ canh tác một loại cây trồng, có ngày bắt đầu/kết thúc |
| **Step** | Giai đoạn VietGAP | Ánh xạ 5 giai đoạn bắt buộc, kiểm soát trình tự |
| **Log** | Nhật ký sản xuất | Đơn vị xác minh tối tiểu, lưu hash bất biến trên blockchain |

Thiết kế phân cấp này đảm bảo hai tính chất: (1) **tính đầy đủ** — không bỏ qua giai đoạn nào trong quy trình VietGAP; (2) **tính truy xuất** — từ mã QR sản phẩm có thể truy ngược qua Product → Season → Step → Log, lấy toàn bộ nhật ký thực địa.

#### 4.3.3 Các giai đoạn sản xuất và ràng buộc nghiệp vụ

Hệ thống định nghĩa 5 loại bước sản xuất bắt buộc, tương ứng với 5 giai đoạn của tiêu chuẩn VietGAP:

| Loại bước | Nội dung VietGAP cần ghi nhận | Rủi ro an toàn thực phẩm |
|---|---|---|
| **PREPARE** | Xử lý đất, lịch sử ô nhiễm, cải tạo | Thấp — ảnh hưởng nền |
| **PLANTING** | Giống, nguồn gốc, ngày gieo, mật độ | Thấp |
| **CARE** | Thuốc BVTV (tên, nồng độ, PHI), phân bón, tưới | **Cao nhất** — tồn dư hóa chất |
| **HARVEST** | Ngày thu hoạch, sản lượng, chất lượng cảm quan | Trung bình |
| **POST_HARVEST** | Bảo quản, đóng gói, vận chuyển nội bộ | Trung bình |

Bước **CARE** đặc biệt quan trọng vì liên quan trực tiếp đến an toàn thực phẩm: thuốc bảo vệ thực vật phải có số đăng ký hợp lệ, không trong danh mục cấm; khoảng cách an toàn trước thu hoạch (Pre-Harvest Interval — PHI) phải được tuân thủ. VietGAP yêu cầu ghi đầy đủ thông tin này cho mỗi lần phun/bón, và thông tin này được lưu trong trường `description` của Log kèm timestamp bất biến trên blockchain.

**Vòng đời mùa vụ và ràng buộc trình tự:**

Mùa vụ tuân theo vòng đời trạng thái có kiểm soát:

```
PENDING → IN_PROGRESS → COMPLETED
               ↓
           CANCELLED
```

Ràng buộc nghiệp vụ quan trọng: mùa vụ chỉ chuyển sang `COMPLETED` khi đã ghi nhận đủ 5 bước bắt buộc theo đúng trình tự VietGAP. Ràng buộc này được thực thi ở tầng backend, ngăn chặn việc bỏ qua giai đoạn hoặc ghi ngược thời gian (backdating).

#### 4.3.4 Đảm bảo tính toàn vẹn dữ liệu với ProcessTracking.sol

Ghi nhật ký trên cơ sở dữ liệu truyền thống có thể bị chỉnh sửa lén lút bởi quản trị viên cơ sở dữ liệu, hoặc bởi chính nhà vận hành nền tảng. Để đảm bảo **tính bất biến (immutability)**, Farmera V2 neo dữ liệu lên blockchain qua smart contract `ProcessTracking.sol`:

Khi nông dân hoàn thành một nhật ký, hệ thống tự động thực hiện chuỗi thao tác sau:

```
1. Tính SHA-256 của nội dung nhật ký
   (description + GPS + timestamp + image hashes + stepId)
              ↓
2. Gọi ProcessTracking.storeLog(logId, sha256Hash) lên zkSync Era
              ↓
3. Hash được lưu bất biến trong mapping on-chain:
   logHashes[logId] = sha256Hash
              ↓
4. Phát sự kiện LogAddedEvent (kích hoạt pipeline xác minh ảnh)
```

Từ thời điểm hash được ghi, bất kỳ ai cũng có thể xác minh độc lập:

```
1. Tải nội dung nhật ký từ API: GET /api/blockchain/process-tracking/log/{logId}
2. Tính SHA-256 của nội dung đó (tự tính)
3. Truy vấn trực tiếp zkSync Era: ProcessTracking.getLog(logId)
4. So sánh hai hash → khớp = dữ liệu chưa bị sửa đổi kể từ lúc nông dân ghi
```

Đây là lớp bảo vệ **tính toàn vẹn (integrity)**: đảm bảo rằng dữ liệu không bị thay đổi *sau khi* ghi. Tuy nhiên, tính toàn vẹn chưa đảm bảo tính **xác thực (authenticity)** — dữ liệu có thể toàn vẹn nhưng vẫn là thông tin bịa đặt từ đầu. Đây chính là vấn đề core mà lớp xác minh ở mục 4.4 giải quyết.

---

### 4.4 Ghi nhận nhật ký và hệ thống xác minh hai chiều

#### 4.4.1 Bài toán oracle và giới hạn cơ bản của blockchain

Một hệ thống minh bạch nông nghiệp dựa trên blockchain gặp phải một nghịch lý: blockchain đảm bảo rằng *những gì đã ghi lên chain không thể bị thay đổi*, nhưng không có cơ chế nào đảm bảo rằng *những gì ghi lên chain là trung thực*. Đây là vấn đề kinh điển mang tên **oracle problem**.

Caldarelli (2021) chỉ ra: bất kỳ hệ thống blockchain nào cần kết nối với thế giới thực đều phải đối mặt với khoảng cách không thể thu hẹp bằng kỹ thuật blockchain thuần túy — khoảng cách giữa dữ liệu on-chain (số) và thực tế off-chain (vật lý). Trong bối cảnh Farmera V2, một nông dân gian lận hoàn toàn có thể:

- Chụp ảnh nông sản của người khác và đính kèm vào nhật ký của mình
- Khai GPS sai vị trí (GPS spoofing)
- Bịa đặt nội dung hoạt động canh tác không có thật
- Đưa toàn bộ thông tin gian lận lên blockchain — và blockchain sẽ lưu vĩnh viễn sự gian lận đó với đầy đủ tính bất biến

Vấn đề này không thể giải quyết bằng blockchain thuần túy. Cần một **oracle** — cơ chế xác minh độc lập kết nối thực tế vật lý với dữ liệu số — đặt giữa hành động ghi nhật ký và việc lưu lên chain.

#### 4.4.2 Kiến trúc giải pháp: AI sơ bộ kết hợp kiểm định viên con người

Farmera V2 giải quyết oracle problem theo kiến trúc xác minh **hai tầng**. Kiến trúc này xuất phát từ sự bù đắp lẫn nhau giữa hai phương pháp:

| | AI tự động | Kiểm định viên con người |
|---|---|---|
| **Tốc độ** | Gần tức thì | Phút đến giờ |
| **Chi phí** | Rất thấp | Đáng kể |
| **Có thể phát hiện** | Ảnh không liên quan, ảnh trùng lặp, ảnh stock, GPS bất hợp lý | Nội dung gian lận tinh vi, bất hợp lý về ngữ cảnh nông nghiệp |
| **Không thể phát hiện** | Ảnh thật chụp sai địa điểm, hoạt động bịa đặt nhưng ảnh hợp lệ | Không có điểm yếu căn bản nếu có đủ kiểm định viên |

**Thiết kế phân luồng:** AI được dùng để *phân loại* trước — chỉ những log có dấu hiệu đáng ngờ mới được chuyển đến kiểm định viên. Điều này cân bằng chi phí vận hành với độ bao phủ xác minh.

```
Nhật ký hoàn thành
       │
       ▼
[Tầng 1] AI: pHash + Google Vision
       │
       ├── Chất lượng cao (≥ 0.8) ──────────────→ LogDefaultPackage (không cần auditor)
       │
       ├── Chất lượng trung bình (0.6–0.8) ──→ 20% ngẫu nhiên → [Tầng 2] Kiểm định viên
       │                                        80% còn lại → LogDefaultPackage
       │
       └── Chất lượng thấp (< 0.6) ──────────→ [Tầng 2] Kiểm định viên (bắt buộc)
                                                        │
                                                        ▼
                                               LogAuditorPackage (có tiêu chí Tc)
```

#### 4.4.3 Xác minh ảnh tự động — pHash và Google Cloud Vision

Khi nhật ký được ghi lên blockchain, sự kiện `LogAddedEvent` được phát ra. `VerificationService` — một dịch vụ NestJS độc lập, chạy cron đồng bộ mỗi 10 giây — lắng nghe sự kiện này và khởi động quy trình phân tích ảnh qua hai kỹ thuật độc lập, bổ sung cho nhau:

**Phát hiện trùng lặp bằng Perceptual Hash (pHash):**

Perceptual hash là fingerprint nhỏ gọn phản ánh nội dung trực quan của ảnh, được tính bằng thuật toán DCT (Discrete Cosine Transform). Khoảng cách Hamming giữa hai pHash đo mức độ khác biệt trực quan — hai ảnh có khoảng cách ≤ 10 bit được coi là trùng lặp thực chất. Kỹ thuật này phát hiện ảnh tái sử dụng từ log cũ hoặc tải từ Internet, kể cả khi ảnh đã qua resize, crop nhẹ hay điều chỉnh màu sắc — những biến đổi đủ để qua mặt so sánh pixel trực tiếp (exact hash) nhưng không đánh lừa được pHash.

**Phân tích ngữ nghĩa bằng Google Cloud Vision API:**

Ảnh được gửi đến Google Cloud Vision để đánh giá ba chiều:

- **Relevance**: mức độ liên quan của nội dung ảnh với hoạt động nông nghiệp khai báo trong log (phát hiện ảnh hoàn toàn không liên quan)
- **Originality**: các dấu hiệu cho thấy ảnh là ảnh thực tế chứ không phải ảnh stock, ảnh render hay ảnh được tìm trên Internet
- **No-duplicate**: xác nhận không trùng lặp với cơ sở dữ liệu ảnh đã biết (kết hợp kết quả pHash)

Điểm tổng hợp:

```
image_score = 0.35 × relevance + 0.35 × originality + 0.30 × no_duplicate
```

Hai tiêu chí relevance và originality nhận trọng số bằng nhau (35% mỗi chiều) vì chúng đánh giá nội dung từ hai góc độ bổ sung — relevance kiểm tra *cái gì* trong ảnh, originality kiểm tra *nguồn gốc* của ảnh. No-duplicate nhận 30%, đã được hỗ trợ từ cả pHash lẫn Vision API.

#### 4.4.4 Phân luồng quyết định và ánh xạ ngữ cảnh tính điểm

Dựa trên `image_score`, `VerificationService` phân luồng log theo ba mức ngưỡng, mỗi mức ánh xạ vào ngữ cảnh tính điểm Trust Score tương ứng:

**Ngưỡng cao (≥ 0.8) — Auto-skip:**

Log có chất lượng ảnh đủ cao để hệ thống tin tưởng hoàn toàn vào AI. Sự kiện `LogSkipReviewEvent` được phát ra on-chain, log đi thẳng vào `LogDefaultPackage`. Không có sự tham gia của kiểm định viên.

**Ngưỡng trung bình (0.6–0.8) — Probabilistic Sampling:**

Vùng không chắc chắn — hệ thống không đủ tự tin để bỏ qua hoàn toàn, nhưng kiểm định tất cả sẽ quá tốn kém. Giải pháp là **lấy mẫu ngẫu nhiên 20%**: trong số các log rơi vào vùng này, 20% được chọn ngẫu nhiên để chuyển đến kiểm định viên (LogAuditorPackage), 80% còn lại đi theo LogDefaultPackage. Tính ngẫu nhiên đảm bảo không thể dự đoán trước log nào bị chọn kiểm tra — loại bỏ khả năng nông dân gian lận có chọn lọc.

**Ngưỡng thấp (< 0.6) — Mandatory Audit:**

Ảnh có dấu hiệu rõ ràng của gian lận hoặc chất lượng không chấp nhận. Bắt buộc phải có kiểm định viên, log được chuyển sang `LogAuditorPackage` — công thức tính điểm có thêm tiêu chí Tc phản ánh đồng thuận kiểm định viên.

**Tính bất đối xứng giữa hai ngữ cảnh:**

Ngưỡng chấp nhận ở LogAuditorPackage (≥ 70) cao hơn LogDefaultPackage (≥ 60) — phản ánh kỳ vọng cao hơn khi đã có sự tham gia của con người. Nếu sau khi kiểm định viên xem xét mà điểm vẫn không đạt, log bị từ chối và không được lưu Trust Score hợp lệ.

#### 4.4.5 Mạng lưới kiểm định viên phi tập trung — AuditorRegistry.sol

Khi log được chuyển đến kiểm định viên, câu hỏi đặt ra là: **ai xác minh và cơ chế nào đảm bảo họ xác minh trung thực?**

Thay vì dùng một bên tập trung (centralized oracle) — tạo ra điểm thất bại duy nhất và nguy cơ tham nhũng — Farmera V2 triển khai mạng lưới kiểm định viên phi tập trung được quản lý hoàn toàn on-chain bởi `AuditorRegistry.sol`.

**Cơ chế gia nhập và cam kết kinh tế (Staking):**

Để tham gia mạng lưới, kiểm định viên phải stake ETH tối thiểu tương đương $1 USD — ngưỡng được tính động qua Chainlink ETH/USD Price Feed để chống biến động giá. Staking tạo ra **cam kết kinh tế**: kiểm định viên có thứ để mất nếu hành xử gian lận.

**Bỏ phiếu và đồng thuận có trọng số uy tín:**

Khi nhận log cần xác minh, các kiểm định viên bỏ phiếu nhị phân `isValid: true/false`. Sau khi đủ `MIN_AUDITORS` phiếu, kết quả đồng thuận được tính theo **trọng số uy tín (reputation-weighted)**: kiểm định viên có reputationScore cao đóng góp bằng chứng nhiều hơn, phản ánh track record của họ trong lịch sử xác minh. Cơ chế này dựa trên nền tảng **Beta Reputation System** của Jøsang & Ismail (2002) [3] — framework Bayesian cho phép lượng hóa mức độ tin cậy từ dữ liệu nhị phân, trong đó mỗi kiểm định viên đóng góp bằng chứng tỷ lệ với reputation score (chi tiết công thức Tc tại mục 4.5.2).

**Cơ chế trừng phạt hậu kiểm (Slashing):**

Nếu kiểm định viên phê duyệt một log sau đó bị phát hiện gian lận, họ bị:
- Trừ 5 điểm reputationScore
- Cắt 0.1 ETH stake

Nếu stake giảm dưới ngưỡng $1 USD (quy đổi), kiểm định viên bị vô hiệu hóa tự động. Slashing là **trừng phạt hậu kiểm** — tạo ra chi phí dài hạn không thể tránh khỏi cho hành vi gian lận có hệ thống.

Ba cơ chế staking + reputation weighting + slashing kết hợp đảm bảo kiểm định trung thực là **chiến lược ưu thế (dominant strategy)** theo lý thuyết mechanism design: ở mỗi thời điểm, phần thưởng kỳ vọng từ kiểm định trung thực cao hơn lợi ích từ gian lận khi tính đến xác suất bị phát hiện và hậu quả slashing.

#### 4.4.6 Tính điểm tin cậy on-chain — TrustComputation.sol

Sau khi ngữ cảnh được xác định (AI auto hoặc qua kiểm định viên), `TrustComputation.sol` tính điểm Trust Score cho nhật ký trực tiếp trên blockchain. Việc tính điểm on-chain đảm bảo ba tính chất quan trọng:

- **Bất biến công thức**: công thức tính điểm được deploy một lần và không thể thay đổi, ngay cả bởi nhà vận hành
- **Một lần ghi**: mỗi logId chỉ được tính điểm một lần — smart contract từ chối mọi yêu cầu tính lại nếu timestamp đã khác 0
- **Công khai kiểm chứng**: bất kỳ bên thứ ba nào cũng có thể gọi lại công thức với cùng đầu vào và kiểm tra kết quả

`MetricSelection.sol` đóng vai trò registry, ánh xạ ngữ cảnh vào package tính điểm tương ứng:

```
Ngữ cảnh "default" (AI phê duyệt) → LogDefaultPackage.sol
    S_log = (60 × Tsp + 40 × Te) / 100
    Ngưỡng chấp nhận: S_log ≥ 60

Ngữ cảnh "auditor" (qua kiểm định viên) → LogAuditorPackage.sol
    S_log = (55 × Tc + 30 × Tsp + 15 × Te) / 100
    Ngưỡng chấp nhận: S_log ≥ 70
```

Nền tảng lý thuyết cho việc lựa chọn tiêu chí, trọng số và phương pháp tổng hợp MCDA/WSM được trình bày chi tiết tại mục 4.5.

---

### 4.5 Cơ chế tính điểm số — Hệ thống FTES

#### 4.5.1 Định nghĩa và vai trò của Trust Score

**Trust Score** là giá trị số lượng hóa đại diện cho mức độ *trustworthiness* — độ tin cậy — của một thực thể được đánh giá trong hệ thống [1]. Trong Farmera V2, đối tượng được đánh giá tin cậy là **nhật ký canh tác (Log)**: mỗi Log là một lời khai của nông dân về một hoạt động sản xuất cụ thể, và Trust Score định lượng mức độ hệ thống tin vào lời khai đó.

Hệ thống Farmera V2 có hai loại điểm số riêng biệt, không nhầm lẫn:

| Điểm số | Đối tượng | Ý nghĩa |
|---|---|---|
| **Trust Score** | Nhật ký (Log) | Lời khai của nông dân về một hoạt động có đáng tin không? |
| **Farm Score** | Trang trại (Farm) | Trang trại này minh bạch và đáng tin cậy ở mức độ nào? |

Trust Score được tính **on-chain** (trên smart contract, bất biến và công khai). Farm Score được tính **off-chain** (backend), tổng hợp từ tất cả Trust Score của các Log thuộc trang trại, kết hợp với chỉ số thương mại.

---

#### 4.5.2 Trust Score của nhật ký — Nền tảng MCDA và Weighted Sum Model

##### 4.5.2.1 Bài toán tổng hợp đa tiêu chí

Việc tính Trust Score cho một Log là bài toán **tổng hợp nhiều tiêu chí độc lập** thành một con số duy nhất đại diện cho "mức độ đáng tin" của Log đó. Đây là bài toán thuộc lĩnh vực **Multiple-Criteria Decision Analysis (MCDA)** — một nhánh của nghiên cứu vận hành dùng để đánh giá các giải pháp dựa trên nhiều tiêu chí khi các tiêu chí có thể mâu thuẫn hoặc có mức độ quan trọng khác nhau.

Các tiêu chí trong Farmera V2 là: đồng thuận kiểm định viên (Tc), độ chính xác vị trí GPS (Tsp), và mức độ đầy đủ bằng chứng (Te). Ba tiêu chí này độc lập nhau về nguồn gốc dữ liệu và ý nghĩa ngữ nghĩa — đây là điều kiện tiên quyết để áp dụng MCDA.

##### 4.5.2.2 Lý do chọn Weighted Sum Model (WSM)

**Weighted Sum Model (WSM)** — còn gọi là *weighted linear combination* — là phương pháp MCDA đơn giản và phổ biến nhất, trong đó mỗi tiêu chí được gán trọng số tương ứng với tầm quan trọng của nó, và tổng có trọng số chính là điểm số cuối cùng:

```
S_log = w₁ × Tc + w₂ × Tsp + w₃ × Te        (Σwᵢ = 1)
```

Lý do WSM phù hợp cho bài toán này và các phương án thay thế đã bị loại bỏ:

| Phương pháp | Vấn đề khi áp dụng cho Log scoring | Kết luận |
|---|---|---|
| **Weighted Product** | Zero-collapse: nếu bất kỳ tiêu chí nào = 0, tích = 0 hoàn toàn, không phân biệt được mức độ tệ | Loại |
| **TOPSIS** | Xếp hạng *tương đối* giữa các phương án với nhau — điểm của Log A phụ thuộc vào Log B, C, D trong cùng batch. Farmera cần điểm **tuyệt đối độc lập** cho từng log để lưu bất biến on-chain | Loại |
| **ELECTRE / PROMETHEE** | ELECTRE cho ra đồ thị outranking, không ra điểm số duy nhất; không phù hợp khi cần một scalar cụ thể để lưu blockchain | Loại |
| **WSM** | Cho ra điểm tuyệt đối, tính độc lập từng log, minh bạch, dễ giải thích, tính được on-chain với gas cost thấp | **Chọn** |

##### 4.5.2.3 Các tiêu chí và nền tảng lý thuyết

Các tiêu chí (T) được chọn dựa trên khung lý thuyết về **Data Quality Dimensions** của Wang & Strong (1996) [2] — công trình nền tảng định nghĩa các chiều chất lượng dữ liệu từ góc nhìn người dùng. Cụ thể, ba tiêu chí tương ứng với ba chiều chất lượng:

| Tiêu chí | Ký hiệu | Chiều DQ (Wang & Strong, 1996) [2] |
|---|---|---|
| Đồng thuận kiểm định viên | Tc | Believability — mức độ thông tin được coi là đúng và đáng tin |
| Độ chính xác không gian | Tsp | Accuracy — mức độ dữ liệu phản ánh chính xác thực tế |
| Độ hoàn chỉnh bằng chứng | Te | Completeness — mức độ dữ liệu đủ và không thiếu |

---

**Tiêu chí Tc — Đồng thuận kiểm định viên (Consensus Score)**

Tc đo mức độ đồng thuận của mạng lưới kiểm định viên có uy tín về tính hợp lệ của một Log. Công thức:

```
α = Σ reputationScore_i   (auditors bỏ phiếu "hợp lệ")
β = Σ reputationScore_i   (auditors bỏ phiếu "không hợp lệ")

Tc = α / (α + β) × 100
```

Công thức này được xây dựng trên cơ sở lý thuyết **Beta Reputation System** của Jøsang & Ismail (2002) [3]:

*Cơ sở lý thuyết:* Mỗi kiểm định viên chỉ có hai lựa chọn nhị phân: hợp lệ hoặc không hợp lệ. Ta không biết "xác suất thực sự" Log là hợp lệ, mà chỉ quan sát các vote — đây là bài toán **ước lượng xác suất từ dữ liệu nhị phân**, giải pháp Bayesian chuẩn là dùng phân phối Beta với α và β là số lần quan sát thành công và thất bại. Jøsang & Ismail (2002) [3] chứng minh rằng khi feedback đến từ các agent có độ uy tín khác nhau, mỗi agent nên đóng góp lượng bằng chứng tỷ lệ với reputation của họ — framework gốc không yêu cầu số lượng bằng chứng phải là số nguyên, do đó dùng `reputationScore` làm trọng số hoàn toàn nhất quán về mặt lý thuyết.

*Tại sao không dùng binary (accept/reject):* Loại bỏ hoàn toàn thông tin biên độ đồng thuận. Một Log được nhất trí bởi 10 auditor uy tín cao đáng tin hơn nhiều so với Log vừa đủ 51% phiếu — nhưng binary sẽ đồng đều cả hai thành 1.

*Tại sao không dùng simple vote ratio:* Hệ thống `reputationScore` trong `AuditorRegistry` tồn tại để phân biệt auditor có track record tốt và xấu. Nếu không dùng reputation làm trọng số, toàn bộ cơ chế này trở nên vô nghĩa đối với Tc.

*Tại sao không dùng EigenTrust:* EigenTrust có độ phức tạp O(n²) — không khả thi để tính on-chain do chi phí gas không thể chấp nhận.

---

**Tiêu chí Te — Độ hoàn chỉnh bằng chứng (Evidence Completeness)**

Te đo mức độ đầy đủ của bằng chứng trực quan (ảnh + video) kèm theo Log:

```
Te = min( (imageCount + videoCount) / (MAX_IMAGE + MAX_VIDEO) , 1 ) × 100
```

Đây là dạng tổng quát `min(x / x_max, 1)` được Pipino, Lee & Wang (2002) [4] đề xuất như metric chuẩn cho chiều **Completeness** trong đánh giá chất lượng dữ liệu: đo tỷ lệ giữa giá trị thực tế so với giá trị tối đa kỳ vọng, giới hạn tại 1 để tránh phần thưởng cho dư thừa.

---

**Tiêu chí Tsp — Độ chính xác không gian (Spatial Plausibility)**

Tsp kiểm tra xem vị trí GPS ghi nhận khi tạo Log có nằm trong phạm vi hợp lý của mảnh đất đã đăng ký không:

```
dist = sqrt( (lat_log - lat_plot)² + (lng_log - lng_plot)² )   [đơn vị: 1e-6 độ]

Tsp = { 100,  nếu dist ≤ MAX_DISTANCE (≈100m)
       {   0,  nếu dist > MAX_DISTANCE
```

*Tại sao Squared Euclidean thay vì Haversine:* Haversine là công thức địa lý chính xác nhưng cần hàm lượng giác (`sin`, `cos`, `arcsin`) không tồn tại trong Solidity. Với khoảng cách nhỏ dưới vài chục kilômét, mặt đất xấp xỉ phẳng và sai số Euclidean là không đáng kể so với GPS accuracy của thiết bị di động (~5–15m).

*Tại sao binary:* Tsp là **design decision** thuần túy — câu hỏi "nông dân có đang ở thửa đất đã đăng ký không?" có ý nghĩa nhị phân trong ngữ cảnh này. Nếu GPS nằm ngoài phạm vi 100m, đó là dấu hiệu rõ ràng rằng log không được tạo tại đồng ruộng, bất kể khoảng cách thực tế là bao nhiêu.

---

##### 4.5.2.4 Hai ngữ cảnh tính điểm và trọng số

Tùy theo con đường xác minh (AI auto-skip hay qua kiểm định viên), hệ thống áp dụng hai bộ trọng số khác nhau, phản ánh sự khác biệt về độ tin cậy của nguồn xác minh:

**Context "default" — `LogDefaultPackage.sol` (AI tự động phê duyệt):**

```
S_log = (w_sp × Tsp + w_e × Te) / 100

w_sp = 60   (Spatial Plausibility — trọng số cao hơn vì không có auditor)
w_e  = 40   (Evidence Completeness)
Ngưỡng chấp nhận: S_log ≥ 60
```

Trong ngữ cảnh này, không có tiêu chí Tc vì chưa có kiểm định viên tham gia. Trọng số dịch chuyển về phía Tsp — bằng chứng vật lý duy nhất có thể kiểm tra tự động.

**Context "auditor" — `LogAuditorPackage.sol` (qua kiểm định viên):**

```
S_log = (w_c × Tc + w_sp × Tsp + w_e × Te) / 100

w_c  = 55   (Consensus — trọng số cao nhất vì đây là xác nhận con người)
w_sp = 30   (Spatial Plausibility)
w_e  = 15   (Evidence Completeness)
Ngưỡng chấp nhận: S_log ≥ 70   (ngưỡng cao hơn vì đã qua xem xét)
```

Phân bổ trọng số phản ánh thứ tự tin cậy: xác nhận đa người (Tc) > bằng chứng vị trí (Tsp) > bằng chứng số lượng (Te).

---

#### 4.5.3 Farm Score — Điểm tổng hợp của trang trại

Trang trại trong Farmera V2 đóng hai vai trò song song: **nhà sản xuất thực phẩm** cần minh bạch quy trình canh tác, và **nhà cung cấp trên sàn thương mại** cần chứng minh độ tin cậy giao hàng. Hai vai trò này yêu cầu hai chiều đánh giá tương ứng, tổng hợp thành Farm Score:

```
Farm Score = f(Farm Transparency Score, Order Fulfillment Rate, Market Validation)
```

##### 4.5.3.1 Farm Transparency Score — Điểm minh bạch quy trình sản xuất

Farm Transparency Score tổng hợp N Trust Score của các Log thuộc trang trại thành một điểm minh bạch duy nhất. Điểm này trả lời câu hỏi: *"Toàn bộ nhật ký canh tác của trang trại này, xét chung lại, có đáng tin không?"*

**Lựa chọn phương pháp: Geometric Mean (trung bình nhân)**

Geometric Mean — trung bình nhân — của N số dương được tính theo công thức:

```
G = (s₁ × s₂ × ... × sₙ)^(1/N) = exp( (1/N) × Σ ln(sᵢ) )
```

Để tránh trường hợp `ln(0)` khi Trust Score bằng 0, công thức áp dụng một hằng số bù nhỏ:

```
Farm Transparency Score = exp( (1/N) × Σ ln(max(sᵢ, ε)) )

Trong đó:
  sᵢ = Trust Score của log thứ i (on-chain, đã tính bất biến)
  N  = tổng số log của trang trại
  ε  = hằng số bù nhỏ để tránh ln(0)
```

**Lý do chọn Geometric Mean thay vì Arithmetic Mean:**

Geometric Mean phù hợp để tổng hợp N điểm số đồng nhất khi mục tiêu là **phát hiện bất thường**. Tính chất *penalization* của Geometric Mean đảm bảo một log bất thường không bị pha loãng bởi số đông log tốt — điều mà Arithmetic Mean không làm được:

```
Ví dụ: 9 logs điểm 1.0, 1 log điểm 0.01

Arithmetic Mean = (9 × 1.0 + 0.01) / 10 = 0.901   ← log xấu bị "nuốt"
Geometric Mean  = (1.0⁹ × 0.01)^(1/10)  = 0.631   ← log xấu kéo điểm xuống rõ rệt
```

Trong ngữ cảnh thực phẩm sạch, một Log gian lận không thể bị "pha loãng" bởi những Log tốt xung quanh — điều đó sẽ phá vỡ hoàn toàn ý nghĩa của hệ thống xác minh.

##### 4.5.3.2 Order Fulfillment Rate (OFR) — Tỷ lệ hoàn thành đơn hàng

OFR là tỷ lệ đơn hàng được thực hiện thành công — giao đúng hàng, đúng thời gian, không bị hủy bởi phía trang trại. Đây là chỉ số hành vi khách quan đo độ tin cậy giao hàng của nhà cung cấp:

```
OFR = Số đơn hàng hoàn thành thành công / Tổng số đơn hàng đã nhận
```

Nền tảng học thuật: Parasuraman et al. (2005) trong thang đo **E-S-QUAL** xác định *Fulfillment* là một trong bốn chiều cốt lõi của chất lượng dịch vụ thương mại điện tử, định nghĩa là "mức độ thực hiện đúng cam kết về giao hàng." Deshpande & Pendem (2022) củng cố điều này qua phân tích thực nghiệm trên 15 triệu đơn hàng từ nền tảng Tmall, chứng minh hiệu suất giao hàng ảnh hưởng trực tiếp và đáng kể đến rating của seller và doanh số bán hàng.

##### 4.5.3.3 Market Validation (MV) — Điểm đánh giá từ người mua

MV là điểm đánh giá trung bình từ người mua thực tế sau khi nhận sản phẩm, phản ánh nhận thức chất lượng tích lũy từ phía người tiêu dùng:

```
MV = avg(product_ratings) / 5        [thang 0–1]
```

Nền tảng học thuật: Chevalier & Mayzlin (2006) chứng minh thực nghiệm rằng điểm đánh giá trực tuyến là tín hiệu có giá trị thống kê phản ánh chất lượng thực sự của sản phẩm và nhà cung cấp, không thể thay thế bằng các chỉ số hành vi như OFR.

##### 4.5.3.4 Kết hợp hai chiều đánh giá

OFR và MV bổ sung cho nhau theo nguyên tắc đa chiều của Saaty (1980) trong Analytic Hierarchy Process: OFR phản ánh **hành vi giao hàng thực tế** (objective — quan sát được), trong khi MV phản ánh **nhận thức chất lượng tích lũy** từ phía người tiêu dùng (perceptual — chủ quan nhưng có giá trị thống kê). Hai chiều này độc lập và bổ sung — một trang trại có thể giao hàng đúng hạn nhưng chất lượng sản phẩm thực sự kém, hoặc ngược lại.

```
Farm Score = f(Farm Transparency Score, OFR, MV)
```

Cụ thể hóa hàm tổng hợp và trọng số sẽ được hiệu chỉnh dựa trên dữ liệu thực nghiệm trong giai đoạn triển khai thí điểm.

---

#### 4.5.4 Tóm tắt toàn bộ pipeline tính điểm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FARMERA SCORING PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Log được thêm                                                          │
│       │                                                                 │
│       ▼  Xác minh ảnh (AI + pHash)                                     │
│  ┌────────────────┐                                                     │
│  │ Image Score    │  = 0.35×relevance + 0.35×originality + 0.30×unique │
│  └───────┬────────┘                                                     │
│          │                                                              │
│          ▼  Routing (AI auto / Auditor review)                          │
│  ┌───────────────────────────────────────────────────┐                  │
│  │              TRUST SCORE (on-chain)                │                  │
│  │                                                   │                  │
│  │  Context "default":                               │                  │
│  │  S_log = (60×Tsp + 40×Te) / 100                  │                  │
│  │  accept nếu S_log ≥ 60                            │                  │
│  │                                                   │                  │
│  │  Context "auditor":                               │                  │
│  │  S_log = (55×Tc + 30×Tsp + 15×Te) / 100          │                  │
│  │  accept nếu S_log ≥ 70                            │                  │
│  │                                                   │                  │
│  │  Tc: Beta Reputation System [3]                   │                  │
│  │  Te: Completeness metric [4]                      │                  │
│  │  Tsp: GPS binary check (design decision)          │                  │
│  └───────┬───────────────────────────────────────────┘                  │
│          │ Lưu vĩnh viễn on-chain (bất biến)                           │
│          │                                                              │
│          ▼  Tổng hợp N logs                                            │
│  ┌───────────────────────────────────────────────────┐                  │
│  │         FARM TRANSPARENCY SCORE (off-chain)        │                  │
│  │                                                   │                  │
│  │  T_farm = exp( (1/N) × Σ ln(max(sᵢ, ε)) )        │                  │
│  │                                                   │                  │
│  │  Geometric Mean — phát hiện bất thường            │                  │
│  │  1 log xấu không bị "pha loãng" bởi N log tốt    │                  │
│  └───────┬───────────────────────────────────────────┘                  │
│          │                                                              │
│          ▼  Kết hợp với chiều thương mại                               │
│  ┌───────────────────────────────────────────────────┐                  │
│  │              FARM SCORE (tổng hợp)                 │                  │
│  │                                                   │                  │
│  │  OFR: tỷ lệ hoàn thành đơn hàng [Parasuraman]   │                  │
│  │  MV:  đánh giá trung bình người mua [Chevalier]  │                  │
│  │                                                   │                  │
│  │  Farm Score = f(T_farm, OFR, MV)                 │                  │
│  └───────────────────────────────────────────────────┘                  │
│                                                                         │
│  Cơ sở lý thuyết:                                                       │
│  [1] Leteane & Ayalew (2024) — Trust Score definition                  │
│  [2] Wang & Strong (1996) — Data Quality Dimensions                     │
│  [3] Jøsang & Ismail (2002) — Beta Reputation System                   │
│  [4] Pipino, Lee & Wang (2002) — Completeness metric                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Luồng thương mại điện tử

#### 4.6.1 Vòng đời sản phẩm

```
Farmer tạo sản phẩm → Gán mùa vụ sản xuất → Cấu hình giá, số lượng
      ↓
Sản phẩm hiển thị trên chợ (kèm điểm FTES của trang trại)
      ↓
Buyer tìm kiếm / lọc sản phẩm
      ↓
Xem chi tiết sản phẩm → Xem lịch sử sản xuất on-chain
      ↓
Đặt hàng → Tính phí vận chuyển (GHN API) → Thanh toán
      ↓
Farmer nhận thông báo → Tạo đơn vận chuyển GHN → Giao hàng
      ↓
Buyer nhận hàng → Xác nhận → Viết đánh giá
      ↓
Đánh giá → Cập nhật CustomerTrustScore → Ảnh hưởng điểm FTES trang trại
```

#### 4.6.2 Tích hợp QR Code truy xuất nguồn gốc

Mỗi sản phẩm/lô hàng được tạo một mã QR duy nhất. Khi quét:
1. Hiển thị thông tin trang trại (tên, địa chỉ, điểm FTES)
2. Hiển thị thông tin sản phẩm (tên, mô tả, giá trị dinh dưỡng)
3. Hiển thị lịch sử canh tác (mùa vụ, các bước, nhật ký đã xác minh)
4. Link trực tiếp đến blockchain explorer để xác minh hash độc lập

#### 4.6.3 Luồng vận chuyển

```
Buyer đặt hàng với địa chỉ giao hàng
      ↓
Backend gọi GHN API → Tính phí vận chuyển (distance-based)
      ↓
Buyer xác nhận phí → Thanh toán tổng
      ↓
Farmer tạo đơn GHN → Nhận mã vận đơn
      ↓
GHN giao hàng → Webhook cập nhật trạng thái về backend
      ↓
Buyer nhận thông báo từng bước (lấy hàng, đang vận chuyển, đã giao)
```

---

### 4.7 Hệ thống lưu trữ file đa provider

Farmera V2 sử dụng Factory Pattern cho lưu trữ file, cho phép chuyển đổi provider mà không thay đổi code business logic:

```
STORAGE_TYPE env var
      ↓
FileStorageFactory
      ├── 'local'   → LocalStorageService  (phát triển)
      ├── 'r2'      → R2StorageService      (Cloudflare R2 — chi phí thấp)
      ├── 'azure'   → AzureBlobService      (Microsoft Azure Blob Storage)
      └── 'pinata'  → PinataService         (IPFS — phân tán, cho dữ liệu quan trọng)
```

**Lý do hỗ trợ Pinata (IPFS):** Ảnh minh chứng canh tác có thể được lưu trên IPFS — phân tán, kiểm duyệt bền vững. Hash IPFS của ảnh (CID) có thể được đưa vào hash dữ liệu trước khi ghi lên blockchain, cho phép xác minh tính toàn vẹn của cả ảnh lẫn nội dung nhật ký.

---

### 4.8 Thiết kế API và chuẩn hóa response

#### 4.8.1 Cấu trúc response chuẩn

Mọi API response đều được bọc bởi `TransformInterceptor`:

```json
{
  "statusCode": 200,
  "code": "SUCCESS_CODE",
  "message": "Thao tác thành công",
  "data": { ... }
}
```

#### 4.8.2 Routing

- Global prefix: `/api`
- Versioning: URI-based (ví dụ `/api/v1/farm`)
- Route grouping qua `RouterModule`:
  - `/api/crop-management/*` — quản lý canh tác
  - `/api/admin/*` — quản trị
  - `/api/ftes/*` — FTES scoring
  - `/api/blockchain/*` — tương tác blockchain

#### 4.8.3 Danh sách endpoint chính

| Module | Endpoint | Method | Mô tả |
|---|---|---|---|
| Auth | `/api/auth/register` | POST | Đăng ký tài khoản |
| Auth | `/api/auth/login` | POST | Đăng nhập |
| Farm | `/api/farm/register` | POST | Đăng ký trang trại |
| Farm | `/api/farm/verify` | POST | Nộp CCCD + video sinh trắc học |
| Farm | `/api/farm/:farmId` | GET | Xem thông tin trang trại (public) |
| Plot | `/api/crop-management/plot` | POST | Tạo mảnh đất |
| Season | `/api/crop-management/season` | POST | Tạo mùa vụ |
| Step | `/api/crop-management/step` | POST | Tạo bước sản xuất |
| Log | `/api/crop-management/log` | POST | Thêm nhật ký canh tác |
| Log | `/api/crop-management/log/:id/finish` | PATCH | Hoàn thành nhật ký → ghi blockchain |
| Product | `/api/product` | GET | Tìm kiếm sản phẩm (public) |
| Product | `/api/product/:id` | GET | Chi tiết sản phẩm (public) |
| Order | `/api/order` | POST | Đặt hàng |
| QR | `/api/qr/:productId` | GET | Lấy QR code truy xuất nguồn gốc |
| FTES | `/api/ftes/transparency/farm/:farmId` | GET | Điểm minh bạch trang trại |
| Blockchain | `/api/blockchain/process-tracking/log/:logId` | GET | Xác minh hash on-chain |
| Review | `/api/review` | POST | Viết đánh giá sản phẩm |

---

### 4.9 Cơ sở dữ liệu

#### 4.9.1 Sơ đồ thực thể chính

```
User ──────────────┐
  │                │ 1:1
  │ 1:1            ▼
  │            Farm ──── 1:N ──── Plot ──── 1:N ──── Season ──── 1:N ──── SeasonDetail (Step)
  │                │                                                              │
  │                │ 1:N                                                          │ 1:N
  │                ▼                                                              ▼
  │           Product ──── 1:N ──── OrderItem                                  Log ──── 1:N ──── LogImage
  │                │                   │                                          │
  │                │                   │ N:1                                      │ 1:1
  │                │ 1:N               ▼                                          ▼
  │                ▼              Order ──── 1:1 ──── Payment         ImageVerificationResult
  │            Review
  │
  ▼
DeliveryAddress
```

#### 4.9.2 Thiết kế UUID và bảo mật ID

Mọi entity đều sử dụng hai loại ID:
- **ID nội bộ (auto-increment integer):** Chỉ dùng trong JOIN nội bộ, performance cao
- **Public UUID (uuid):** Expose ra API, ngăn chặn enumeration attack

Các trường nhạy cảm (password hash, token) được đánh dấu `@Exclude()` để tự động loại khỏi response serialization.

#### 4.9.3 Audit Trail

Hệ thống sử dụng **database triggers** (thiết lập qua migration) để tự động ghi audit log mỗi khi có sự thay đổi trên các bảng quan trọng — không phụ thuộc vào application code, đảm bảo tính toàn vẹn audit ngay cả khi có truy cập trực tiếp vào database.

---



## Chương 5: Kết Quả Đạt Được

### 5.1 Các chức năng đã triển khai

#### 5.1.1 Hệ thống xác thực và phân quyền
- Đăng ký / Đăng nhập với JWT (Access Token + Refresh Token trong httpOnly cookie)
- Phân quyền RBAC: BUYER, FARMER, ADMIN
- Xác minh trang trại bằng sinh trắc học (CCCD + video khuôn mặt)
- Quy trình duyệt trang trại bởi Admin

#### 5.1.2 Quản lý canh tác số
- CRUD đầy đủ cho Mảnh đất (Plot), Mùa vụ (Season), Bước sản xuất (Step), Nhật ký (Log)
- Ghi nhận ảnh minh chứng cho từng nhật ký
- Ghi nhận GPS cho từng nhật ký
- Phân loại cây trồng ngắn ngày / dài ngày
- Vòng đời trạng thái mùa vụ (PENDING → IN_PROGRESS → COMPLETED)

#### 5.1.3 Minh bạch hóa và blockchain
- Tự động tính SHA-256 và ghi lên `ProcessTracking.sol` khi nhật ký hoàn thành
- Tính TrustScore on-chain qua `TrustComputation.sol` với `LogDefaultTrustPackage`
- Tính TransparencyScore off-chain cho Step, Season, Plot, Farm
- Cron job cập nhật điểm Farm lúc 3:00 AM hàng ngày
- Lưu lịch sử điểm minh bạch để theo dõi xu hướng

#### 5.1.4 Xác minh thông minh
- Tích hợp Google Cloud Vision API để phân tích ảnh canh tác
- Xác minh GPS dựa trên tọa độ mảnh đất đăng ký
- Hệ thống kiểm định viên (AuditorProfile) với đăng ký và bỏ phiếu xác minh

#### 5.1.5 Thương mại điện tử
- Quản lý sản phẩm với danh mục và tìm kiếm/lọc đa tiêu chí
- Đặt hàng hàng loạt (batch order — nhiều sản phẩm từ nhiều trang trại)
- Tính phí vận chuyển thực tế qua GHN API
- Tạo đơn vận chuyển GHN và cập nhật trạng thái qua webhook
- Quản lý địa chỉ giao hàng (tích hợp dữ liệu hành chính Việt Nam)
- Đánh giá sản phẩm (1-5 sao, kèm ảnh, nội dung) và trả lời đánh giá

#### 5.1.6 Truy xuất nguồn gốc
- Tạo mã QR cho sản phẩm/lô hàng
- API tra cứu thông tin truy xuất đầy đủ từ QR
- Liên kết sản phẩm với mùa vụ sản xuất cụ thể

#### 5.1.7 Thông báo đa kênh
- Firebase push notification cho mobile
- SMS qua Twilio
- Email qua SendGrid
- Quản lý template thông báo và kênh thông báo

#### 5.1.8 Quản trị
- Dashboard admin quản lý trang trại
- Duyệt/từ chối đơn đăng ký trang trại
- Quản lý danh mục sản phẩm

---

### 5.2 Chỉ số kỹ thuật

| Chỉ số | Giá trị |
|---|---|
| Tổng số module NestJS | 13 module nghiệp vụ + 6 module core |
| Tổng số controller | 29 controllers |
| Tổng số entity (bảng DB chính) | ~25 entities |
| Số smart contract | 6 contracts (ProcessTracking, TrustComputation, MetricSelection, LogDefaultPackage, StepTransparencyPackage, AuditorRegistry) |
| Số tầng đánh giá FTES | 5 tầng (Log → Step → Season → Plot → Farm) |
| Công thức tính điểm | 8+ công thức có trọng số cấu hình được |
| Provider lưu trữ file hỗ trợ | 4 (Local, R2, Azure Blob, Pinata/IPFS) |
| Tích hợp bên thứ ba | 8 (Google Vision, GHN, Firebase, Twilio, SendGrid, Chainlink, zkSync, Pinata) |

---

### 5.3 Điểm nổi bật về thiết kế

**1. Nguyên tắc phân tách TrustScore và TransparencyScore:**
Đây là điểm sáng tạo cốt lõi của FTES. TrustScore không bao giờ được cộng trực tiếp — nó chỉ đóng vai trò bộ lọc chất lượng. Điều này tránh được bẫy "điểm số bị phình" khi nhật ký giả có thể được "pha loãng" vào điểm tổng hợp.

**2. Mô hình suy giảm theo thời gian (Exponential Decay):**
Cây dài ngày được tính điểm với mùa vụ gần đây có trọng số cao hơn, phản ánh thực tế rằng tình trạng sản xuất hiện tại quan trọng hơn lịch sử xa. Half-life 6 tháng là tham số có cơ sở thực tiễn.

**3. Factory Pattern cho lưu trữ:**
Cho phép chuyển từ lưu trữ cục bộ sang cloud storage chỉ bằng thay đổi biến môi trường, không thay đổi code.

**4. Sử dụng zkSync Era (Layer 2):**
Giảm chi phí giao dịch blockchain ~100 lần so với Ethereum mainnet, làm cho việc ghi hash mỗi nhật ký hàng ngày trở nên khả thi về mặt kinh tế.

---

## Chương 6: Kết Luận và Phương Hướng Phát Triển

### 6.1 Kết luận

Đề tài đã hoàn thành xây dựng **Farmera V2** — một nền tảng chợ số thông minh cho thực phẩm sạch tích hợp công nghệ blockchain. Các kết quả chính đạt được:

1. **Giải quyết bài toán minh bạch quy trình sản xuất** bằng cách kết hợp ba lớp bằng chứng: hash bất biến trên blockchain, xác minh ảnh bằng AI, và xác minh vị trí GPS.

2. **Xây dựng hệ thống chấm điểm minh bạch FTES** đa tầng, có thể định lượng, có thể giải thích và có thể tái tính toán độc lập — khác với các nhãn "đã chứng nhận" thông thường.

3. **Tích hợp thương mại điện tử đầy đủ** giúp nông dân có thể vừa chứng minh chất lượng vừa bán hàng trực tiếp cho người tiêu dùng, xóa bỏ rào cản trung gian.

4. **Kiến trúc kỹ thuật hiện đại và mở rộng được** với NestJS 11, TypeORM, zkSync Era — cho phép phát triển tiếp theo dễ dàng.

**Hạn chế còn tồn tại:**

- Phụ thuộc vào độ trung thực của nhà vận hành hệ thống (single-writer pattern): toàn bộ dữ liệu ghi lên blockchain đều thông qua một private key của backend. Mặc dù dữ liệu đã ghi không thể thay đổi, backend vẫn có thể kiểm soát *những gì được ghi*.
- Chưa triển khai đầy đủ mạng lưới kiểm định viên phi tập trung — `AuditorRegistry.sol` đã hoàn thiện về mặt smart contract nhưng tích hợp backend còn hạn chế.
- Chưa có ứng dụng Mobile/Frontend hoàn chỉnh để đưa vào sử dụng thực tế.
- Các trọng số trong công thức FTES hiện tại được thiết lập theo thiết kế chuyên gia, chưa có cơ sở thực nghiệm từ dữ liệu sản xuất thực.

---

### 6.2 Phương hướng phát triển

#### 6.2.1 Ngắn hạn (3-6 tháng)

**A. Hoàn thiện mạng lưới kiểm định viên:**
- Phát triển `AuditorRegistryService` để tích hợp `AuditorRegistry.sol` vào backend
- Xây dựng API cho quy trình đăng ký kiểm định viên, nhận nhiệm vụ, và bỏ phiếu
- Thiết lập cơ chế phân công kiểm định viên ngẫu nhiên (anti-collusion)
- Kết nối kết quả đồng thuận kiểm định viên vào pipeline tính điểm TrustScore

**B. Phát triển ứng dụng Mobile:**
- App dành cho nông dân: ghi nhật ký trực tiếp từ đồng ruộng, chụp ảnh, GPS tự động
- App dành cho người tiêu dùng: quét QR, xem điểm minh bạch, đặt hàng
- Web portal dành cho kiểm định viên

**C. Tối ưu hóa trọng số FTES:**
- Thu thập dữ liệu từ các trang trại thí điểm
- Áp dụng phương pháp AHP (Analytic Hierarchy Process) với chuyên gia nông nghiệp để hiệu chỉnh trọng số
- Phân tích độ nhạy (sensitivity analysis) để kiểm tra tính bền vững của kết quả

#### 6.2.2 Trung hạn (6-18 tháng)

**A. Commit-Reveal Voting cho kiểm định viên:**
- Nâng cấp `AuditorRegistry.sol` với cơ chế commit-reveal hai pha để ngăn front-running và bỏ phiếu theo đám đông
- Giai đoạn 1 (Commit): Kiểm định viên gửi hash(vote + secret)
- Giai đoạn 2 (Reveal): Kiểm định viên công khai vote + secret để kiểm chứng

**B. Decentralized Identity cho nông dân:**
- Cho phép nông dân ký dữ liệu bằng private key riêng (thay vì ký thay bởi backend)
- Tích hợp ví mobile (WalletConnect) để nông dân tự ghi dữ liệu lên blockchain
- Giải quyết triệt để vấn đề single-writer pattern

**C. Tích hợp IoT:**
- Kết nối cảm biến thời tiết, độ ẩm đất, nhiệt độ kho lạnh
- Dữ liệu IoT tự động ghi nhật ký mà không cần can thiệp thủ công
- Tăng độ tin cậy dữ liệu (không thể làm giả số liệu cảm biến)

**D. Phân tích hiệu quả canh tác (DEA — Data Envelopment Analysis):**
- Hoàn thiện Efficiency Score trong FTES thông qua DEA
- So sánh hiệu quả giữa các trang trại cùng quy mô và loại cây trồng
- Cung cấp khuyến nghị cải tiến cụ thể dựa trên benchmarking

#### 6.2.3 Dài hạn (18+ tháng)

**A. Governance on-chain:**
- Cơ chế quản trị phi tập trung để thay đổi tham số hệ thống (trọng số FTES, ngưỡng TrustScore)
- DAO (Decentralized Autonomous Organization) cho cộng đồng nông dân và người tiêu dùng

**B. Tích hợp DeFi:**
- Cho phép thanh toán on-chain bằng stablecoin
- Cơ chế tín dụng dựa trên lịch sử minh bạch FTES (nông dân có điểm cao được vay vốn ưu đãi)
- Sản phẩm tài chính phi tập trung cho nông dân

**C. Mở rộng địa lý:**
- Hỗ trợ đa quốc gia (tiêu chuẩn khác nhau, đơn vị đo lường, loại cây trồng)
- Tích hợp với chuỗi cung ứng quốc tế và chứng nhận export

---

## Tài Liệu Tham Khảo

### Tài liệu về Blockchain và Smart Contract

[1] Buterin, V. (2013). *Ethereum White Paper: A Next-Generation Smart Contract and Decentralized Application Platform*. Ethereum Foundation.

[2] Nakamoto, S. (2008). *Bitcoin: A Peer-to-Peer Electronic Cash System*. bitcoin.org.

[3] zkSync Era Documentation. (2024). *zkSync Era: EVM-compatible ZK Rollup*. Matter Labs. https://docs.zksync.io

[4] Chainlink Labs. (2024). *Chainlink Data Feeds Documentation*. https://docs.chain.link/data-feeds

### Tài liệu về Blockchain trong Nông nghiệp và Chuỗi Cung Ứng

[5] Cui, S., Li, B., Wang, J., & Ma, H. (2024). Blockchain-based agricultural supply chain transparency: A multi-dimensional evaluation framework. *Computers and Electronics in Agriculture*, 218, 108–124.

[6] Caldarelli, G. (2025). Hybrid oracle architectures for real-world blockchain integration: Challenges and solutions. *Journal of Information Systems*, 40(1), 33–55.

[7] Arshad, J., Azad, M. A., Abdur Rehman, M., & Salah, K. (2023). A first look of privacy through the lens of Internet of Things and blockchain. *Concurrency and Computation: Practice and Experience*, 35(4), e5485.

[8] Chakrabortty, R. K., & Essam, D. L. (2024). Multi-factor reputation scoring for distributed verification networks. *IEEE Transactions on Network Science and Engineering*, 11(2), 1945–1958.

[9] Manoj, K., et al. (2025). Privacy-preserving aggregation mechanisms in agricultural blockchain systems: Gas cost analysis and scalability. *Blockchain: Research and Applications*, 6(1), 100162.

[10] Guo, Y., & Liang, C. (2024). Provisional scoring mechanisms for asynchronous verification workflows in distributed systems. *ACM Transactions on Internet Technology*, 24(3), 1–28.

### Tài liệu về Hệ thống Đánh Giá và Minh Bạch

[11] Saaty, T. L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill.

[12] Charnes, A., Cooper, W. W., & Rhodes, E. (1978). Measuring the efficiency of decision making units. *European Journal of Operational Research*, 2(6), 429–444.

[13] Kshetri, N. (2018). 1 Blockchain's roles in meeting key supply chain management objectives. *International Journal of Information Management*, 39, 80–89.

### Tài liệu về Công nghệ Phần Mềm

[14] NestJS Documentation. (2024). *NestJS: A progressive Node.js framework*. https://docs.nestjs.com

[15] TypeORM Documentation. (2024). *TypeORM: ORM for TypeScript*. https://typeorm.io

[16] Web3.js Documentation. (2024). *Web3.js: Ethereum JavaScript API*. https://docs.web3js.org

[17] Google Cloud Vision API. (2024). *Cloud Vision API Documentation*. https://cloud.google.com/vision/docs

### Tài liệu về An Toàn Thực Phẩm tại Việt Nam

[18] Bộ Nông nghiệp và Phát triển Nông thôn. (2022). *Báo cáo Nông nghiệp Việt Nam 2022*. Hà Nội: NXB Nông nghiệp.

[19] TCVN 11041-2:2017. *Nông nghiệp hữu cơ — Phần 2: Trồng trọt hữu cơ*. Bộ Khoa học và Công nghệ.

[20] Cục Quản lý Chất lượng Nông lâm sản và Thủy sản. (2023). *Hướng dẫn áp dụng VietGAP trong sản xuất rau quả*. Hà Nội.

### Tài liệu về Các Nền Tảng Tương Tự

[21] IBM Food Trust. (2024). *IBM Food Trust: Building a smarter food ecosystem*. https://www.ibm.com/products/food-trust

[22] TE-FOOD International. (2024). *TE-FOOD: Farm-to-table food traceability*. https://te-food.com

[23] OriginTrail. (2024). *OriginTrail Decentralized Knowledge Graph (DKG)*. https://origintrail.io

---

*Đồ án được thực hiện tại Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM*
*Ngày hoàn thành: Tháng 2 năm 2026*
